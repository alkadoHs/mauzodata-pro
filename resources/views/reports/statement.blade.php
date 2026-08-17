<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Statement — {{ $customer->name }}</title>
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { margin: 0; color: #1f2937; font-size: 11px; }

        .letterhead { border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 16px; }
        .letterhead h1 { margin: 0; font-size: 17px; letter-spacing: .04em; text-transform: uppercase; }
        .letterhead .owner { font-size: 11px; margin: 2px 0 0; }
        .letterhead .contact { font-size: 10px; color: #6b7280; margin: 3px 0 0; }
        .letterhead .title {
            float: right; text-align: right; font-size: 20px; font-weight: bold;
            color: #4f46e5; letter-spacing: .06em; text-transform: uppercase;
        }
        .clear { clear: both; }

        .parties { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .parties td { vertical-align: top; width: 50%; padding: 0; }
        .label { font-size: 9px; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
        .party-name { font-size: 13px; font-weight: bold; margin: 2px 0 0; }

        /* The number the customer actually cares about. */
        .due-box {
            border: 2px solid #4f46e5; background: #eef2ff; padding: 8px 12px;
            text-align: right; width: 210px; float: right;
        }
        .due-box .amount { font-size: 20px; font-weight: bold; color: #3730a3; }

        table.ledger { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.ledger thead th {
            background: #eef2ff; color: #3730a3; text-align: left; padding: 7px 8px;
            font-size: 9px; text-transform: uppercase; letter-spacing: .04em;
            border-bottom: 1px solid #c7d2fe;
        }
        table.ledger tbody td { padding: 6px 8px; border-bottom: 1px solid #f0f0f2; }
        table.ledger tbody tr:nth-child(even) td { background: #fafafa; }
        .num { text-align: right; white-space: nowrap; }
        .charge { color: #b91c1c; }
        .payment { color: #047857; }
        tfoot td {
            padding: 8px; font-weight: bold; background: #eef2ff;
            color: #3730a3; border-top: 2px solid #c7d2fe;
        }
        .empty { padding: 24px; text-align: center; color: #9ca3af; }
        .foot {
            margin-top: 22px; padding-top: 8px; border-top: 1px solid #e5e7eb;
            font-size: 9px; color: #6b7280;
        }
        .sign { margin-top: 30px; width: 100%; }
        .sign td { width: 50%; font-size: 9px; color: #6b7280; padding-top: 22px; }
        .sign .line { border-top: 1px solid #9ca3af; width: 70%; padding-top: 3px; }
    </style>
</head>
<body>
    <div class="letterhead">
        <div class="title">Statement</div>
        <h1>{{ $company?->name ?? $branchLabel }}</h1>
        @if ($company?->owner_name)
            <p class="owner">{{ $company->owner_name }}</p>
        @endif
        <p class="contact">
            @if ($company?->address){{ $company->address }}@endif
            @if ($company?->phone) &middot; Tel: {{ $company->phone }}@endif
            @if ($company?->alt_phone) / {{ $company->alt_phone }}@endif
            @if ($company?->tax_id) &middot; TIN: {{ $company->tax_id }}@endif
            @if ($company?->vrn) &middot; VRN: {{ $company->vrn }}@endif
        </p>
        <div class="clear"></div>
    </div>

    <table class="parties">
        <tr>
            <td>
                <div class="label">Statement for</div>
                <p class="party-name">{{ strtoupper($customer->name) }}</p>
                @if ($customer->contact)
                    <div style="font-size:10px;color:#6b7280">{{ $customer->contact }}</div>
                @endif
                <div style="font-size:10px;color:#6b7280;margin-top:4px">
                    Branch: {{ $branchLabel }}<br>
                    Generated: {{ $generated }}
                </div>
            </td>
            <td>
                <div class="due-box">
                    <div class="label">Balance due</div>
                    <div class="amount">{{ number_format($balance, 2) }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="clear"></div>

    <table class="ledger">
        <thead>
            <tr>
                <th style="width:80px">Date</th>
                <th>Details</th>
                <th class="num" style="width:90px">Charged</th>
                <th class="num" style="width:90px">Paid</th>
                <th class="num" style="width:100px">Balance</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    <td>{{ $row['date'] }}</td>
                    <td>{{ $row['description'] }}</td>
                    <td class="num charge">{{ $row['charge'] ? number_format($row['charge'], 2) : '' }}</td>
                    <td class="num payment">{{ $row['payment'] ? number_format($row['payment'], 2) : '' }}</td>
                    <td class="num">{{ number_format($row['balance'], 2) }}</td>
                </tr>
            @empty
                <tr><td class="empty" colspan="5">This customer has no credit sales.</td></tr>
            @endforelse
        </tbody>
        @if (count($rows))
            <tfoot>
                <tr>
                    <td colspan="2">TOTALS</td>
                    <td class="num">{{ number_format($charged, 2) }}</td>
                    <td class="num">{{ number_format($paid, 2) }}</td>
                    <td class="num">{{ number_format($balance, 2) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>

    <p class="foot">
        Every credit sale and every payment on this account, oldest first. The
        balance column is what was owed after each entry; the figure at the
        bottom is what is owed today.
    </p>

    <table class="sign">
        <tr>
            <td><div class="line">Customer signature</div></td>
            <td><div class="line">For {{ $company?->name ?? $branchLabel }}</div></td>
        </tr>
    </table>
</body>
</html>
