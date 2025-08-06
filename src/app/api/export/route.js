export async function POST(req) {
  try {
    const { cleanedData } = await req.json()

    // Simulate or generate content to export
    return new Response(JSON.stringify(cleanedData), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response("Export failed", { status: 500 })
  }
}
