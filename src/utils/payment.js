import { supabase } from "@/lib/supabaseClient";

export const startRazorpayPayment = async (user, plan) => {
  try {
    // 1️⃣ Create order from backend
    const orderRes = await fetch("https://YOUR-RAILWAY-URL.up.railway/create-order",{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const orderData = await orderRes.json();

    if (!orderData.success) {
      alert("Failed to create order");
      return;
    }

    const order = orderData.order;

    const options = {
      key: "rzp_test_SepxQh0h37Mvrr", // ✅ put real test key
      amount: order.amount,
      currency: order.currency,
      name: "Empirox EmpiLab",
      description: plan === "monthly" ? "Monthly Plan" : "Yearly Plan",
      order_id: order.id, // ✅ MOST IMPORTANT

      handler: async function (response) {
        try {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (!authUser) {
            alert("User not logged in");
            return;
          }

          const verifyRes = await fetch(
            "https://YOUR-RAILWAY-URL.up.railway/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: authUser.id,
                plan,
              }),
            }
          );

          const result = await verifyRes.json();

          if (!result.success) {
            alert("Payment verification failed!");
            return;
          }

          const expires =
            plan === "monthly"
              ? new Date(Date.now() + 30 * 86400000)
              : new Date(Date.now() + 365 * 86400000);

          const { error } = await supabase
            .from("profiles")
            .update({
              tier: "premium",
              subscription_status: "active",
              billing_cycle: plan,
              premium_expires_at: expires,
            })
            .eq("id", authUser.id);

          if (error) {
            alert("DB update failed!");
            return;
          }

          alert("🎉 EmpiLab Unlocked!");
          window.location.href = "/EmpiLab/Dashboard";
        } catch (err) {
          console.error(err);
          alert("Payment processing failed");
        }
      },

      prefill: {
        email: user.email,
      },

      theme: {
        color: "#4ea0ff",
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", function (res) {
      console.error(res);
      alert("❌ Payment Failed");
    });

    rzp.open();
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};