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
        'attachments',
        'status',
        'note',
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
        'attachments' => 'array',
    ];

    protected $appends = ['paid_amount', 'calculated_status'];

    public function getPaidAmountAttribute()
    {
        // PERFORMANCE FIX: Use eager-loaded sum if available (prevents N+1 queries)
        if (isset($this->payments_sum_amount)) {
            return (float) ($this->payments_sum_amount + ($this->payments_sum_adjustment ?? 0) + ($this->advance_payment ?? 0));
        }
        
        // Fallback to relationship query (when not eager loaded)
        return (float) ($this->payments()->sum('amount') + $this->payments()->sum('adjustment') + ($this->advance_payment ?? 0));
    }

    public function getCalculatedStatusAttribute()
    {
        // If status was manually set to one of the final states, respect the override
        if (in_array($this->status, ['Paid', 'Unpaid', 'Partial'])) {
            return $this->status;
        }

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
