<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $order->id }}</title>
    <style>
       
        #items table {
            font-family: Arial, Helvetica, sans-serif;
            border-collapse: collapse;
            width: 100%;
        }

            #items td, th {
            padding: 8px;
        }

        #items tbody  tr:nth-child(even){background-color: #f2f2f2;}

        #items tr:hover {background-color: #ddd;}

        #items thead  th {
            padding-top: 12px;
            padding-bottom: 12px;
            text-align: left;
            background-color: rgb(201, 227, 210);
        }

        #auth {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
        }

    </style>
</head>
<body>
    <div class="header" style="text-align: center; line-height:1px">
        <p style="font-size: 1rem; font-weight: bold">{{ $order->branch->name }}</p>
        <p> {{ $order->branch->address }}, {{ $order->branch->city }}</p>
        <p> {{ $order->branch->phone }}</p>
    </div>
    <table style="width: 100%; margin-left: 100px; margin-right:100px">
        <tr>
            <td>
                <p>INV  No - 0{{ $order->id }}</p>
                <p>Customer: <span style="text-transform: uppercase">{{ $order->customer->name }}</span></p>
            </td>
            <td>
                <p>Printed by {{ auth()->user()->name }}</p>
                <p>Date: {{ date('d M, Y', strtotime($order->created_at)) }}</p>
            </td>
        </tr>
    </table>
    <br>
    <div id="items">
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $total = 0;
                @endphp
                @foreach ($order->orderItems as $item)
                    @php
                        $total += $item->price * $item->quantity;
                    @endphp
                    <tr>
                        <td>{{ $item->product->name }}</td>
                        <td>{{ $item->quantity }}</td>
                        <td>{{ number_format($item->price) }}</td>
                        <td>{{ number_format($item->price * $item->quantity) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td></td>
                    <th style="text-align: left">TOTAL</th>
                    <td></td>
                    <th>{{ number_format($total) }}</th>
                </tr>
                <tr>
                    <td></td>
                    <th style="text-align: left">AMOUNT PAID</th>
                    <td></td>
                    <th>{{ number_format($order->paid) }}</th>
                </tr>
            </tfoot>
        </table>
        <p style="display: block; text-align:center">
            <i>Thank you for trusting us, welcome again</i>
        </p>
    </div>
</body>
</html>