<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { margin: 0; color: #1f2937; font-size: 11px; }
        .head { border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 12px; }
        .head h1 { margin: 0 0 2px; font-size: 18px; color: #4f46e5; }
        .meta { font-size: 10px; color: #6b7280; }
        .meta span { margin-right: 14px; }
        table { width: 100%; border-collapse: collapse; }
        thead th {
            background: #eef2ff; color: #3730a3; text-align: left;
            padding: 6px 8px; font-size: 10px; text-transform: uppercase;
            letter-spacing: .03em; border-bottom: 1px solid #c7d2fe;
        }
        tbody td { padding: 5px 8px; border-bottom: 1px solid #f0f0f2; }
        tbody tr:nth-child(even) td { background: #fafafa; }
        .num { text-align: right; white-space: nowrap; }
        .due-pos { color: #b91c1c; font-weight: bold; }
        .status { text-transform: capitalize; }
        tfoot td {
            padding: 7px 8px; font-weight: bold;
            border-top: 2px solid #c7d2fe; background: #eef2ff; color: #3730a3;
        }
        .empty { padding: 20px; text-align: center; color: #9ca3af; }
        .summary { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .summary td {
            border: 1px solid #e5e7eb; padding: 6px 8px; width: 33.33%;
            background: #fafafa;
        }
        .summary .label { display: block; font-size: 9px; color: #6b7280; text-transform: uppercase; }
        .summary .value { display: block; font-size: 13px; font-weight: bold; }
        .summary .in { color: #047857; }
        .summary .out { color: #b91c1c; }
        h2 { font-size: 13px; color: #3730a3; margin: 18px 0 6px; }
        .note { font-size: 9px; color: #6b7280; margin: 0 0 6px; }
    </style>
</head>
<body>
    <div class="head">
        <h1>{{ $title }}</h1>
        <div class="meta">
            @foreach ($meta as $label => $value)
                <span><strong>{{ $label }}:</strong> {{ $value }}</span>
            @endforeach
        </div>
    </div>

    @isset ($summary)
        <table class="summary">
            <tr>
                <td>
                    <span class="label">Total sales</span>
                    <span class="value">{{ number_format($summary['sales'], 2) }}</span>
                </td>
                <td>
                    <span class="label">Discount given</span>
                    <span class="value">{{ number_format($summary['discount'], 2) }}</span>
                </td>
                <td>
                    <span class="label">Paid amount</span>
                    <span class="value">{{ number_format($summary['collected_on_sales'], 2) }}</span>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="label">Credit collections</span>
                    <span class="value">{{ number_format($summary['collected_on_previous'], 2) }}</span>
                </td>
                <td>
                    <span class="label">Total money received</span>
                    <span class="value in">{{ number_format($summary['collected_total'], 2) }}</span>
                </td>
                <td>
                    <span class="label">Total expenses</span>
                    <span class="value out">{{ number_format($summary['expenses'], 2) }}</span>
                </td>
            </tr>
            <tr>
                <td colspan="3">
                    <span class="label">Net sales</span>
                    <span class="value in">{{ number_format($summary['net_sales'], 2) }}</span>
                </td>
            </tr>
        </table>
        <p class="note">Net sales = total money received &minus; total expenses.</p>
    @endisset

    <p class="note">Paid = money received on these days. Due = what was still not paid at the end of them.</p>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>Seller</th>
                <th>Status</th>
                <th class="num">Discount</th>
                <th class="num">Total</th>
                <th class="num">Paid</th>
                <th class="num">Due</th>
                <th class="num">GP</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $row)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $row['date'] }}</td>
                    <td>{{ $row['branch'] }}</td>
                    <td>{{ $row['customer'] }}</td>
                    <td>{{ $row['seller'] }}</td>
                    <td class="status">{{ $row['status'] }}</td>
                    <td class="num">{{ $row['discount'] ? number_format($row['discount'], 2) : '—' }}</td>
                    <td class="num">{{ number_format($row['total'], 2) }}</td>
                    <td class="num">{{ number_format($row['paid'], 2) }}</td>
                    <td class="num {{ $row['due'] > 0 ? 'due-pos' : '' }}">{{ number_format($row['due'], 2) }}</td>
                    <td class="num">{{ number_format($row['gp'], 2) }}</td>
                </tr>
            @empty
                <tr><td class="empty" colspan="11">No records for the selected filters.</td></tr>
            @endforelse
        </tbody>
        @if (count($rows))
            <tfoot>
                <tr>
                    <td colspan="6">TOTALS ({{ $totals['count'] }} orders)</td>
                    <td class="num">{{ number_format($totals['discount'], 2) }}</td>
                    <td class="num">{{ number_format($totals['total'], 2) }}</td>
                    <td class="num">{{ number_format($totals['paid'], 2) }}</td>
                    <td class="num">{{ number_format($totals['due'], 2) }}</td>
                    <td class="num">{{ number_format($totals['gp'], 2) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>

    @if (! empty($collections) && count($collections))
        <h2>Credit collections</h2>
        <p class="note">Money paid on these days for credit sales made on earlier days.</p>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Paid on</th>
                    <th>Branch</th>
                    <th>Customer</th>
                    <th>Received by</th>
                    <th>Invoice</th>
                    <th>Sale date</th>
                    <th class="num">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($collections as $i => $c)
                    <tr>
                        <td>{{ $i + 1 }}</td>
                        <td>{{ $c['date'] }}</td>
                        <td>{{ $c['branch'] }}</td>
                        <td>{{ $c['customer'] }}</td>
                        <td>{{ $c['received_by'] }}</td>
                        <td>{{ $c['invoice'] }}</td>
                        <td>{{ $c['sale_date'] }}</td>
                        <td class="num">{{ number_format($c['amount'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="7">TOTAL CREDIT COLLECTIONS ({{ count($collections) }} payments)</td>
                    <td class="num">{{ number_format(collect($collections)->sum('amount'), 2) }}</td>
                </tr>
            </tfoot>
        </table>
    @endif

    @if (! empty($expenses) && count($expenses))
        <h2>Expenses</h2>
        <p class="note">Money spent on these days.</p>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Spent by</th>
                    <th>Item</th>
                    <th class="num">Cost</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($expenses as $i => $e)
                    <tr>
                        <td>{{ $i + 1 }}</td>
                        <td>{{ $e['date'] }}</td>
                        <td>{{ $e['branch'] }}</td>
                        <td>{{ $e['user'] }}</td>
                        <td>{{ $e['item'] }}</td>
                        <td class="num">{{ number_format($e['cost'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5">TOTAL EXPENSES ({{ count($expenses) }} items)</td>
                    <td class="num">{{ number_format(collect($expenses)->sum('cost'), 2) }}</td>
                </tr>
            </tfoot>
        </table>
    @endif
</body>
</html>
