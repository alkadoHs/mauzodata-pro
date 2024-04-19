<?php

namespace App\Models\Filters;

use Lacodix\LaravelModelFilter\Enums\FilterMode;
use Lacodix\LaravelModelFilter\Filters\DateFilter;

class CreatedABetweenFilter extends DateFilter
{
    public FilterMode $mode = FilterMode::BETWEEN;
    
    protected string $field = 'created_at';
}
