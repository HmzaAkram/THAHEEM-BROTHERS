<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'company_id',
        'company_name',
        'date',
        'amount',
        'reference',
        'method',
        'description',
        'bill_id',
        'adjustment',
        'tracking_id',
        'cheque_no',
        'pay_order_no',
    ];

    protected $casts = [
        'date' => 'string',
        'amount' => 'decimal:2',
        'adjustment' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }
}
