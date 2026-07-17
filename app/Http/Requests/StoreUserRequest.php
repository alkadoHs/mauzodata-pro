<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)],
            'phone' => ['required', 'string', 'max:13', Rule::unique(User::class)],
            // Only an admin may assign the admin role (see User::assignableRoles).
            'role' => ['required', Rule::in(User::assignableRoles(auth()->user()))],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            // Must be a branch of the caller's own company.
            'branch_id' => [
                'required',
                Rule::exists('branches', 'id')->where('company_id', auth()->user()->company_id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.exists' => 'The selected branch does not belong to your company.',
            'role.in' => 'Only an admin can create an admin. Choose Manager or Seller.',
        ];
    }
}
