import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEMO_SCHOOL_ID = "11111111-1111-1111-1111-111111111111";
const DEMO_EVENT_ID = "22222222-2222-2222-2222-222222222222";
const DEMO_USERS = [
  { id: "33333333-3333-3333-3333-333333333333", username: "user_1025", email: "user1025@demo.driplock", password: "demo123" },
  { id: "44444444-4444-4444-4444-444444444444", username: "user_1026", email: "user1026@demo.driplock", password: "demo123" },
  { id: "55555555-5555-5555-5555-555555555555", username: "user_1027", email: "user1027@demo.driplock", password: "demo123" },
];

const PHOTO_URLS = [
  "https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/3768663/pexels-photo-3768663.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/3624970/pexels-photo-3624970.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/3840597/pexels-photo-3840597.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/4058416/pexels-photo-4058416.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/3686768/pexels-photo-3686768.jpeg?auto=compress&cs=tinysrgb&w=400",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create demo users
    const createdUsers: { id: string; username: string }[] = [];

    for (const demoUser of DEMO_USERS) {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", demoUser.id)
        .maybeSingle();

      if (!existingUser) {
        // Create auth user
        await supabase.auth.signUp({
          email: demoUser.email,
          password: demoUser.password,
        });

        // Create profile
        await supabase.from("profiles").insert({
          id: demoUser.id,
          username: demoUser.username,
          school_id: DEMO_SCHOOL_ID,
          avatar_initials: demoUser.username.slice(0, 2).toUpperCase(),
        });

        createdUsers.push({ id: demoUser.id, username: demoUser.username });
      } else {
        createdUsers.push(existingUser);
      }
    }

    // Create demo locks
    const locks = [
      {
        user_id: DEMO_USERS[0].id,
        event_id: DEMO_EVENT_ID,
        title: "ROSE GOLD MERMAID GOWN",
        description: "Stunning sequin mermaid gown",
        color: "rose gold",
        style: "mermaid gown",
        size: "M",
        photo_urls: [PHOTO_URLS[0]],
      },
    ];

    for (const lock of locks) {
      await supabase.from("locks").upsert(
        {
          id: "66666666-6666-6666-6666-666666666666",
          ...lock,
          is_verified: true,
        },
        { onConflict: "id" }
      );

      await supabase.from("locks").upsert(
        {
          id: "77777777-7777-7777-7777-777777777777",
          user_id: DEMO_USERS[1].id,
          event_id: DEMO_EVENT_ID,
          title: "NAVY A-LINE DRESS",
          description: "Elegant navy a-line dress",
          color: "navy",
          style: "a-line dress",
          size: "S",
          photo_urls: [PHOTO_URLS[1]],
          is_verified: true,
        },
        { onConflict: "id" }
      );

      await supabase.from("locks").upsert(
        {
          id: "88888888-8888-8888-8888-888888888888",
          user_id: DEMO_USERS[2].id,
          event_id: DEMO_EVENT_ID,
          title: "BLUSH BALLGOWN",
          description: "Romantic blush ballgown",
          color: "blush pink",
          style: "ballgown",
          size: "L",
          photo_urls: [PHOTO_URLS[2]],
          is_verified: true,
        },
        { onConflict: "id" }
      );
    }

    // Create demo listings
    await supabase.from("listings").upsert(
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        user_id: DEMO_USERS[0].id,
        title: "CHAMPAGNE SEQUIN DRESS",
        category: "Dress",
        size: "M",
        color: "champagne",
        price_cents: 7500,
        listing_type: "rent",
        photo_urls: [PHOTO_URLS[3]],
        is_available: true,
      },
      { onConflict: "id" }
    );

    await supabase.from("listings").upsert(
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        user_id: DEMO_USERS[1].id,
        title: "RED BODYCON DRESS",
        category: "Dress",
        size: "S",
        color: "red",
        price_cents: 12000,
        listing_type: "sell",
        photo_urls: [PHOTO_URLS[4]],
        is_available: true,
      },
      { onConflict: "id" }
    );

    await supabase.from("listings").upsert(
      {
        id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        user_id: DEMO_USERS[2].id,
        title: "SAGE GREEN MAXI",
        category: "Dress",
        size: "L",
        color: "sage green",
        price_cents: 5000,
        listing_type: "rent",
        photo_urls: [PHOTO_URLS[5]],
        is_available: true,
      },
      { onConflict: "id" }
    );

    await supabase.from("listings").upsert(
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        user_id: DEMO_USERS[0].id,
        title: "BLACK JUMPSUIT",
        category: "Jumpsuit",
        size: "M",
        color: "black",
        price_cents: 8000,
        listing_type: "sell",
        photo_urls: [PHOTO_URLS[0]],
        is_available: true,
      },
      { onConflict: "id" }
    );

    // Create demo conversations
    await supabase.from("conversations").upsert(
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        user_a: DEMO_USERS[0].id,
        user_b: DEMO_USERS[1].id,
        listing_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      },
      { onConflict: "id" }
    );

    // Create demo messages
    await supabase.from("messages").upsert(
      {
        id: "10101010-1010-1010-1010-101010101010",
        conversation_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        sender_id: DEMO_USERS[1].id,
        content: "Hey! Is the red dress still available?",
      },
      { onConflict: "id" }
    );

    await supabase.from("messages").upsert(
      {
        id: "20202020-2020-2020-2020-202020202020",
        conversation_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        sender_id: DEMO_USERS[0].id,
        content: "Yes! Still have it. Want to try it on?",
      },
      { onConflict: "id" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo data seeded successfully",
        createdUsers,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
