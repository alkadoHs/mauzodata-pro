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
        tfoot td {
            padding: 7px 8px; font-weight: bold;
            border-top: 2px solid #c7d2fe; background: #eef2ff; color: #3730a3;
        }
        .empty { padding: 20px; text-align: center; color: #9ca3af; }
        h2 { font-size: 13px; color: #3730a3; margin: 18px 0 6px; }
        .note { font-size: 9px; color: #6b7280; margin: 0 0 6px; }

        /* One row per category, a horizontal bar built from a table cell's
           background so it survives dompdf without any SVG/canvas support. */
        .bar-row td { padding: 5px 8px; border-bottom: 1px solid #f0f0f2; vertical-align: middle; }
        .bar-track { width: 100%; height: 10px; background: #eef2ff; border-radius: 3px; }
        .bar-fill { height: 10px; background: #4f46e5; border-radius: 3px; }
        .bar-name { width: 26%; font-weight: bold; }
        .bar-track-cell { width: 44%; }
        .bar-amount { width: 15%; text-align: right; white-space: nowrap; }
        .bar-percent { width: 15%; text-align: right; color: #6b7280; white-space: nowrap; }
    </style>
</head>
<body>
    <div class="head">
        <h1>{{ $title }}</h1>
        <div class="meta">
            @foreach ($meta as $label => $value)
                <span><strong>{{ $label }}:</strong> {{ $value }}</span>
            @endforeach
            <span><strong>Total spent:</strong> {{ number_format($totals['cost'], 2) }}</span>
        </div>
    </div>

    @if (count($categories))
        <h2>By category</h2>
        <p class="note">What this money went on, highest spend first.</p>

        <table>
            @foreach ($categories as $c)
                <tr class="bar-row">
                    <td class="bar-name">{{ $c['name'] }}</td>
                    <td class="bar-track-cell">
                        <div class="bar-track">
                            <div class="bar-fill" style="width: {{ max($c['percent'], 2) }}%;"></div>
                        </div>
                    </td>
                    <td class="bar-amount">{{ number_format($c['cost'], 2) }}</td>
                    <td class="bar-percent">{{ number_format($c['percent'], 1) }}% &middot; {{ $c['count'] }} item{{ $c['count'] === 1 ? '' : 's' }}</td>
                </tr>
            @endforeach
            <tfoot>
                <tr>
                    <td colspan="2">TOTAL ({{ count($categories) }} categories)</td>
                    <td class="num">{{ number_format($totals['cost'], 2) }}</td>
                    <td class="num">{{ $totals['count'] }} item{{ $totals['count'] === 1 ? '' : 's' }}</td>
                </tr>
            </tfoot>
        </table>
    @endif

    <h2>Every expense</h2>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Branch</th>
                <th>Spent by</th>
                <th>Category</th>
                <th>Item</th>
                <th class="num">Cost</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $row)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $row['date'] }}</td>
                    <td>{{ $row['branch'] }}</td>
                    <td>{{ $row['user'] }}</td>
                    <td>{{ $row['category'] }}</td>
                    <td>{{ $row['item'] }}</td>
                    <td class="num">{{ number_format($row['cost'], 2) }}</td>
                </tr>
            @empty
                <tr><td class="empty" colspan="7">No expenses for the selected filters.</td></tr>
            @endforelse
        </tbody>
        @if (count($rows))
            <tfoot>
                <tr>
                    <td colspan="6">TOTAL ({{ $totals['count'] }} items)</td>
                    <td class="num">{{ number_format($totals['cost'], 2) }}</td>
                </tr>
            </tfoot>
        @endif
    </table>
</body>
</html>
