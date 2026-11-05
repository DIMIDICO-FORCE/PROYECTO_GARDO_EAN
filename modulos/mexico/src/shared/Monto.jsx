import React from 'react';
import './monto.css';
export default function Monto({value}){
 if(typeof value!=='string'||!value.includes(' MXN (≈ '))return value;
 const [mxn,cop]=value.split(' (≈ ');
 return <span className="moneda-doble"><span>{mxn}</span><small>≈ {cop.slice(0,-1)}</small></span>;
}
