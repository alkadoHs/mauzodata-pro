<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Bundles several ReportExport sheets into one workbook — used so a sales
 * report can ship its credit-collections sheet alongside the sales sheet.
 */
class MultiSheetExport implements WithMultipleSheets
{
    use Exportable;

    /**
     * @param  array<int,ReportExport>  $sheets
     */
    public function __construct(private array $sheets) {}

    /**
     * @return array<int,ReportExport>
     */
    public function sheets(): array
    {
        return $this->sheets;
    }
}
