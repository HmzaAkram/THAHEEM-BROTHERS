<?php

namespace App\Http\Controllers;

use App\Models\Exporter;
use Illuminate\Http\Request;

class ExporterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $exporters = Exporter::orderBy('name', 'asc')->get();
        return response()->json($exporters);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:exporters,name|max:255',
        ]);

        $exporter = Exporter::create($validated);

        return response()->json($exporter, 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Exporter $exporter)
    {
        $exporter->delete();
        return response()->json(null, 204);
    }
}
