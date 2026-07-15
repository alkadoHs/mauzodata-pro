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

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>Seller</th>
                <th>Status</th>
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
                    <td class="num">{{ number_format($row['total'], 2) }}</td>
                    <td class="num">{{ number_format($row['paid'], 2) }}</td>
                    <td class="num {{ $row['due'] > 0 ? 'due-pos' : '' }}">{{ number_format($row['due'], 2) }}</td>
                    <td class="num">{{ number_format($row['gp'], 2) }}</td>
                </tr>
            @empty
                <tr><td class="empty" colspan="10">No records for the selected filters.</td></tr>
            @endforelse
        </tbody>
        @if (count($rows))
            <tfoot>
                <tr>
                    <td colspan="6">TOTALS ({{ $totals['count'] }} orders)</td>
                    <td class="num">{{ number_format($totals['total'], 2) }}</td>
                    <td class="num">{{ number_format($totals['paid'], 2) }}</td>
                    <td class="num">{{ number_format($totals['due'], 2) }}</td>
                    <td class="num">{{ number_format($totals['gp'], 2) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>
</body>
</html>
