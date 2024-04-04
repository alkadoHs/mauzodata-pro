<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'unit' => 'required|string|max:50',
            'buy_price' => 'required|numeric|max:9999999999',
            'sale_price' => 'required|numeric|max:9999999999',
            'stock' => 'required|numeric|max:99999999',
            'stock_alert' => 'required|numeric|max:99999999',
            'whole_sale' => 'required|numeric|max:99999999',
            'whole_price' => 'required|numeric|max:9999999999',
            'expire_date' => 'nullable|date',
        ];
    }
}
