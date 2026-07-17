<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    {{--
        Generic tabular PDF: any report can hand over $headings + $rows without
        needing its own blade. $numericFrom marks the first right-aligned column.
    --}}
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
                @foreach ($headings as $i => $heading)
                    <th class="{{ $i >= $numericFrom ? 'num' : '' }}">{{ $heading }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $index => $row)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    @foreach ($row as $i => $cell)
                        <td class="{{ $i >= $numericFrom ? 'num' : '' }}">
                            {{ $i >= $numericFrom && is_numeric($cell) ? number_format((float) $cell) : $cell }}
                        </td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td class="empty" colspan="{{ count($headings) + 1 }}">No records for this period.</td>
                </tr>
            @endforelse
        </tbody>
        @if (! empty($totalsRow))
            <tfoot>
                <tr>
                    <td colspan="{{ $numericFrom + 1 }}">TOTAL ({{ count($rows) }})</td>
                    @foreach ($totalsRow as $cell)
                        <td class="num">{{ is_numeric($cell) ? number_format((float) $cell) : $cell }}</td>
                    @endforeach
                </tr>
            </tfoot>
        @endif
    </table>
</body>
</html>
