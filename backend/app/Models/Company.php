<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Company extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'ntn',
        'username',
        'status',
        'password',
    ];

    /**
     * The attributes that are not mass assignable.
     * Protects critical fields from mass assignment vulnerabilities.
     *
     * @var list<string>
     */
    protected $guarded = [
        'id',
        'identifier',  // Auto-generated, should not be manually set
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',  // Never expose password in API responses
    ];

    protected $appends = ['role', 'identifier', 'balance'];

    public function getRoleAttribute()
    {
        return 'company';
    }

    public function getIdentifierAttribute()
    {
        return 'C' . $this->id;
    }

    public function getBalanceAttribute()
    {
        $billed = (float) $this->bills()->sum('grand_total');
        $paid = (float) $this->payments()->sum('amount');
        return $billed - $paid;
    }



    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function securities(): HasMany
    {
        return $this->hasMany(SecurityTracking::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',  // Automatically hash passwords
        ];
    }
}
