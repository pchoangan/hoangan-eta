import { NextResponse } from 'next/server';

//const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxejicC-DhVc40W78Y9_kveg_jVru4TPrXGtUun7L1VHDOa8kUCeYvOjc1DCWIAlw/exec";


export async function GET() {
  try {
    const response = await fetch(SCRIPT_URL, { 
      cache: "no-store",
      redirect: 'follow' // Bắt buộc để xử lý redirect từ Google
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy dữ liệu" }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const formData = await request.json(); // Lấy dữ liệu từ client gửi lên
    
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(formData),
      redirect: 'follow'
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi gửi dữ liệu" }, { status: 500 });
  }
}
