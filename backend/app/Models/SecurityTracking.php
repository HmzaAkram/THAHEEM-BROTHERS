<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SecurityTracking extends Model
{
    protected $table = 'securities_tracking';

    protected $fillable = [
        'company_id',
        'company_name',
        'gd_number',
        'no_of_containers',
        'container_no',
        'amount_per_container',
        'total_amount',
        'refund_days',
        'port',
        'is_document_submitted',
        'refund_due_date',
        'is_refund_received',
        'received_amount_date',
        'pay_order_no',
        'receiver_name',
        'status',
    ];

    protected $casts = [
        'is_document_submitted' => 'boolean',
        'is_refund_received' => 'boolean',
        'refund_due_date' => 'date',
        'received_amount_date' => 'date',
        'amount_per_container' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'no_of_containers' => 'integer',
        'refund_days' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
