<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Same as StoreUserRequest, but unique checks ignore this user and the
     * password is optional (only changed when actually filled in).
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $target */
        $target = $this->route('user');
        $userId = $target?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($userId)],
            'phone' => ['required', 'string', 'max:13', Rule::unique(User::class)->ignore($userId)],
            // Only an admin may assign the admin role; a manager can't promote
            // anyone (including themselves) into it.
            'role' => ['required', Rule::in(User::assignableRoles(auth()->user()))],
            'password' => ['nullable', 'string', 'min:6', 'max:255'],
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
            'role.in' => 'Only an admin can grant the admin role. Choose Manager or Seller.',
        ];
    }
}
