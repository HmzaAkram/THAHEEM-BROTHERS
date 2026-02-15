<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasApiTokens;

class Company extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [

        'name',
        'identifier',
        'email',
        'phone',
        'address',
        'city',
        'ntn',
        'username',
        'password',
        'status',
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
}
