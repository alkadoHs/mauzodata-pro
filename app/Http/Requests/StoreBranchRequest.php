<?php

namespace App\Http\Requests;

use App\Models\Branch;
use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:50',
            'phone' => 'required|max:13|unique:'.Branch::class,
            'email' => 'nullable|string|max:50|unique:'.Branch::class,
            'city' => 'required|string|max:50',
            'address' => 'required|string|max:255',
            'tax_id' => 'nullable|max:50',
        ];
    }
}
