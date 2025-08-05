export async function POST({ request }) {
  const { token } = await request.json();
  const secret = process.env.HCAPTCHA_SECRET_KEY;
  if (!token || !secret) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing token or secret' }),
      { status: 400 }
    );
  }

  try {
    const verifyRes = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `response=${token}&secret=${secret}`
    });
    const data = await verifyRes.json();
    if (data.success) {
      return new Response(JSON.stringify({ success: true }));
    } else {
      return new Response(
        JSON.stringify({ success: false, error: data['error-codes'] }),
        { status: 200 }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
