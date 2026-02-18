<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueryMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'query_id',
        'message',
        'sender_type',
    ];

    public function parentQuery()
    {
        return $this->belongsTo(Query::class, 'query_id');
    }
}
