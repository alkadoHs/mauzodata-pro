<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Http\Controllers\Concerns\BuildsSalesReports;
use App\Models\Customer;
use App\Models\Order;
use App\Support\CurrentBranch;
use App\Support\SalesReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CreditSalesReportController extends Controller
{
    use BuildsSalesReports;

    public function __construct(
        private readonly SalesReport $report,
        private readonly CurrentBranch $branch,
    ) {}

    public function index(Request $request): Response
    {
        $filters = $this->reportFilters($request);
        $rows = $this->creditRows($filters);

        return Inertia::render('Reports/CreditSalesReport', [
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
            'filters' => $filters,
            'sellers' => $this->reportSellers($this->branch),
            'branchLabel' => $this->reportBranchLabel($this->branch),
        ]);
    }

    public function excel(Request $request): BinaryFileResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->creditRows($filters);

        $export = new ReportExport(
            $this->report->headings(),
            $this->report->orderedRows($rows),
            'Credit Sales Report',
        );

        return Excel::download($export, $this->exportFilename('credit-sales-report', $filters).'.xlsx');
    }

    public function pdf(Request $request): HttpResponse
    {
        $filters = $this->reportFilters($request);
        $rows = $this->creditRows($filters);

        $this->guardPdf($rows);

        $pdf = Pdf::loadView('reports.sales', [
            'title' => 'Credit Sales Report',
            'meta' => $this->report->meta($filters, $this->reportBranchLabel($this->branch), allWhenNoDates: true),
            'rows' => $rows,
            'totals' => $this->report->totals($rows),
        ])->setPaper('a4', 'landscape');

        return $pdf->download($this->exportFilename('credit-sales-report', $filters).'.pdf');
    }

    /**
     * One credit sale's payment history, fetched when the dialog opens.
     *
     * Not folded into the report payload: thousands of credit sales would each
     * drag their payments along for a panel that is opened one at a time.
     */
    public function payments(Order $order): JsonResponse
    {
        // Order is branch-scoped, so route-model binding already refused
        // anything outside the branch this user is working in.
        $sale = $order->creditSale;

        $billed = (float) $order->orderItems()->sum('total');

        $payments = $sale
            ? $sale->creditSalePayments()->with('user:id,name')->oldest()->get()
            : collect();

        $balance = $billed;

        return response()->json([
            'order' => [
                'id' => $order->id,
                'invoice' => $order->invoice_number,
                'date' => optional($order->created_at)->format('Y-m-d H:i'),
                'customer' => $order->customer?->name ?? 'Walk-in',
                'customer_id' => $order->customer_id,
                'contact' => $order->customer?->contact,
                'seller' => $order->user?->name,
                'status' => $sale?->status ?? $order->status,
            ],
            'billed' => round($billed, 2),
            'paid' => round((float) $payments->sum('amount'), 2),
            'balance' => round($billed - (float) $payments->sum('amount'), 2),
            // Running balance so the dialog reads like a small statement.
            'payments' => $payments->map(function ($p) use (&$balance) {
                $balance -= (float) $p->amount;

                return [
                    'id' => $p->id,
                    'date' => optional($p->created_at)->format('Y-m-d H:i'),
                    'amount' => round((float) $p->amount, 2),
                    'received_by' => $p->user?->name,
                    'balance_after' => round($balance, 2),
                ];
            }),
        ]);
    }

    /**
     * A customer's statement: every credit sale, every payment, and what is
     * still owed. Printed from the company's own letterhead details.
     */
    public function statement(Request $request, Customer $customer): HttpResponse
    {
        // Customer is branch-scoped, so this is already one of ours.
        $orders = Order::query()
            ->where('customer_id', $customer->id)
            ->where('status', 'credit')
            ->with(['creditSale.creditSalePayments.user:id,name', 'branch.company'])
            ->withSum('orderItems as billed', 'total')
            ->oldest()
            ->get();

        // One timeline: a sale adds to what is owed, a payment takes it away.
        $entries = collect();

        foreach ($orders as $order) {
            $entries->push([
                'at' => $order->created_at,
                'date' => optional($order->created_at)->format('Y-m-d'),
                'description' => 'Credit sale · '.($order->invoice_number ?: $order->id),
                'charge' => round((float) $order->billed, 2),
                'payment' => 0.0,
            ]);

            foreach ($order->creditSale?->creditSalePayments ?? [] as $payment) {
                $entries->push([
                    'at' => $payment->created_at,
                    'date' => optional($payment->created_at)->format('Y-m-d'),
                    'description' => 'Payment received'
                        .($payment->user?->name ? ' · '.$payment->user->name : ''),
                    'charge' => 0.0,
                    'payment' => round((float) $payment->amount, 2),
                ]);
            }
        }

        $balance = 0.0;

        $rows = $entries->sortBy('at')->values()->map(function (array $e) use (&$balance) {
            $balance += $e['charge'] - $e['payment'];

            return [...$e, 'balance' => round($balance, 2)];
        });

        $company = $orders->first()?->branch?->company;

        $pdf = Pdf::loadView('reports.statement', [
            'customer' => $customer,
            'company' => $company,
            'branchLabel' => $this->reportBranchLabel($this->branch),
            'rows' => $rows,
            'charged' => round($rows->sum('charge'), 2),
            'paid' => round($rows->sum('payment'), 2),
            'balance' => round($balance, 2),
            'generated' => now()->format('Y-m-d H:i'),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('statement-'.str($customer->name)->slug().'.pdf');
    }

    /**
     * Credit sales and nothing else.
     *
     * This report answers one question — who owes what — so it deliberately
     * carries no cash collections, no expenses and no net-sales figure. Those
     * belong to the sales report, where the day's money is being counted.
     */
    private function creditRows(array $filters)
    {
        return $this->report->rows(
            $this->report->query($filters, creditOnly: true, allWhenNoDates: true),
            creditView: true
        );
    }
}
