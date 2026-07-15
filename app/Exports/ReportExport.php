<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Generic tabular export: headings + pre-ordered rows.
 */
class ReportExport implements FromArray, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    /**
     * @param  array<int,string>  $headings
     * @param  array<int,array<int,mixed>>  $rows  ordered to match $headings
     */
    public function __construct(
        private array $headings,
        private array $rows,
        private string $title = 'Report',
    ) {}

    public function array(): array
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function title(): string
    {
        return $this->title;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
