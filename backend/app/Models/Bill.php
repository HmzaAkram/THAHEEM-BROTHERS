<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bill extends Model
{
    protected $fillable = [
        'company_id',
        'company_name',
        'bill_no',
        'date',
        'job_number',
        'via',
        'weight',
        'packages',
        'exporter',
        'invoice_no',
        'invoice_date',
        'be_number',
        'hawb',
        'igm',
        'index_no',
        'gd_number',
        'no_of_containers',
        'container_no',
        'total_amount',
        'service_charges',
        'sales_tax',
        'advance_payment',
        'grand_total',
        'attachment',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'invoice_date' => 'date',
        'total_amount' => 'float',
        'service_charges' => 'float',
        'sales_tax' => 'float',
        'advance_payment' => 'float',
        'grand_total' => 'float',
        'no_of_containers' => 'integer',
    ];

    protected $appends = ['paid_amount', 'calculated_status'];

    public function getPaidAmountAttribute()
    {
        return (float) $this->payments()->sum('amount');
    }

    public function getCalculatedStatusAttribute()
    {
        $paid = $this->getPaidAmountAttribute();
        if ($paid <= 0) return 'Unpaid';
        if ($paid >= $this->grand_total) return 'Paid';
        return 'Partial';
    }


    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BillItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
