<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Same rules as StoreBranchRequest, but the unique checks ignore this branch.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $branchId = $this->route('branch')?->id;

        return [
            'name' => ['required', 'string', 'max:50', Rule::unique('branches', 'name')->ignore($branchId)],
            'phone' => ['nullable', 'string', 'max:13', Rule::unique('branches', 'phone')->ignore($branchId)],
            'email' => ['nullable', 'email', 'max:50', Rule::unique('branches', 'email')->ignore($branchId)],
            'city' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:50'],
        ];
    }
}
