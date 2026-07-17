<?php

namespace App\Support;

use App\Models\AuthorizationKey;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Issues and verifies the keys that gate critical actions.
 *
 * Keys are stored hashed and shown once, so a database or backup leak reveals
 * nothing usable. That rules out looking a key up by value — instead we check
 * the caller's key against the (few) active keys holding the ability. The
 * candidate set is small by construction, so the bcrypt cost is bounded.
 */
class AuthorizationKeys
{
    /** Unambiguous alphabet — no O/0/I/1, since these get read aloud and typed. */
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const LENGTH = 8;

    /**
     * Create a key and return [model, plaintext]. The plaintext is the only time
     * the caller will ever see it.
     *
     * @param  array<int,string>  $abilities
     * @return array{0:AuthorizationKey,1:string}
     */
    public function issue(
        int $companyId,
        string $name,
        array $abilities,
        bool $singleUse = false,
        ?string $expiresAt = null,
    ): array {
        $plain = $this->generate();

        $key = AuthorizationKey::create([
            'company_id' => $companyId,
            'name' => $name,
            'key_hash' => Hash::make($plain),
            'hint' => substr($plain, -4),
            'abilities' => array_values($abilities),
            'single_use' => $singleUse,
            'expires_at' => $expiresAt,
            'created_by' => auth()->id(),
        ]);

        return [$key, $plain];
    }

    /**
     * Verify a key for an ability. Returns the key on success, null otherwise.
     *
     * A matching single-use key is burned here, inside a locked transaction, so
     * two concurrent requests can never spend the same key twice.
     */
    public function verify(string $ability, ?string $plain, ?int $companyId = null): ?AuthorizationKey
    {
        $plain = trim((string) $plain);
        $companyId ??= auth()->user()?->company_id;

        if ($plain === '' || ! $companyId) {
            return null;
        }

        $candidates = AuthorizationKey::query()
            ->where('company_id', $companyId)
            ->whereJsonContains('abilities', $ability)
            // Not expired…
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            // …and not already spent (multi-use keys keep working after use).
            ->where(fn ($q) => $q->where('single_use', false)->orWhereNull('used_at'))
            ->get();

        foreach ($candidates as $key) {
            if (! Hash::check($plain, $key->key_hash)) {
                continue;
            }

            return $this->redeem($key);
        }

        return null;
    }

    /**
     * Mark usage. For single-use keys the burn is atomic: we re-check under a
     * row lock, so a key that lost the race is rejected rather than reused.
     */
    private function redeem(AuthorizationKey $key): ?AuthorizationKey
    {
        if (! $key->single_use) {
            $key->forceFill(['used_at' => now(), 'used_by' => auth()->id()])->save();

            return $key;
        }

        return DB::transaction(function () use ($key) {
            $locked = AuthorizationKey::whereKey($key->getKey())->lockForUpdate()->first();

            if (! $locked || $locked->used_at !== null) {
                return null; // someone else spent it first
            }

            $locked->forceFill(['used_at' => now(), 'used_by' => auth()->id()])->save();

            return $locked;
        });
    }

    private function generate(): string
    {
        $out = '';
        $max = strlen(self::ALPHABET) - 1;

        for ($i = 0; $i < self::LENGTH; $i++) {
            $out .= self::ALPHABET[random_int(0, $max)];
        }

        return $out;
    }
}
