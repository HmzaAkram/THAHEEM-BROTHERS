<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Query extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'subject',
        'status',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function messages()
    {
        return $this->hasMany(QueryMessage::class);
    }

    public function getLatestMessageAttribute()
    {
        return $this->messages()->latest()->first();
    }
}
