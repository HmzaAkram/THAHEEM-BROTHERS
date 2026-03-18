<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleTax extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'company_name',
        'date',
        'ref_bill_no',
        'clearing_forwarding_of',
        'packages',
        'igm_egm',
        'igm_egm_date',
        'index_no',
        'gd_no',
        'gd_date',
        'value',
        'service_charges',
        'sales_tax_percentage',
        'words',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
        'igm_egm_date' => 'date',
        'gd_date' => 'date',
        'value' => 'float',
        'service_charges' => 'float',
        'sales_tax_percentage' => 'float',
    ];
    
    // Virtual attribute for total calculation logic based on user's image rules
    protected $appends = ['grand_total'];

    public function getGrandTotalAttribute()
    {
        // Typically, Sales Tax Amount = (service_charges) * (sales_tax_percentage / 100)
        $taxAmount = $this->service_charges * ($this->sales_tax_percentage / 100);
        return $this->service_charges + $taxAmount;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
