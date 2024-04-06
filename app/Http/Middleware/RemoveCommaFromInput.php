<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RemoveCommaFromInput
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
         $inputs = $request->all();

         $cleanedInputs = [];
         foreach ($inputs as $key => $value) {
             $cleanedInputs[$key] = is_string($value) ? str_replace(',', '', $value) : $value;
         }

         $request->replace($cleanedInputs);

         return $next($request);
    }
}
