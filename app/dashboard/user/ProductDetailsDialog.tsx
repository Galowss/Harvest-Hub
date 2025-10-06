"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "../../config/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  query,
  where,
} from "firebase/firestore";

interface ProductDetailsDialogProps {
  product: any;
  open: boolean;
  onClose: () => void;
  user: any;
}

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  product,
  open,
  onClose,
  user,
}) => {
  const [farmer, setFarmer] = useState<any>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchFarmerAndRatings = async () => {
    console.log("🔎 Product object:", product);
    console.log("🧑‍🌾 Farmer ID:", product?.farmerId);

    if (!product?.farmerId) {
      console.warn("No farmerId found on product:", product);
      setLoading(false);
      return;
    }


      try {
        // Fetch farmer info
        const farmerRef = doc(db, "users", product.farmerId);
        const farmerSnap = await getDoc(farmerRef);

        if (farmerSnap.exists()) {
          setFarmer(farmerSnap.data());
        } else {
          console.warn("Farmer not found for ID:", product.farmerId);
        }

        // Fetch ratings for this farmer
        const ratingsRef = collection(db, "ratings");
        const q = query(ratingsRef, where("farmerId", "==", product.farmerId));
        const querySnapshot = await getDocs(q);

        console.log("Fetched ratings:", querySnapshot.size);

        if (!querySnapshot.empty) {
          const ratings = querySnapshot.docs.map((d) => {
            const data = d.data();
            return typeof data.rating === "number"
              ? data.rating
              : parseFloat(data.rating || "0");
          });

          const avg =
            ratings.reduce((sum, r) => sum + r, 0) / (ratings.length || 1);
          setAvgRating(Number(avg.toFixed(1)));
        } else {
          setAvgRating(0);
        }
      } catch (error) {
        console.error("Error fetching farmer/ratings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerAndRatings();
  }, [product]);

  const handleAddToCart = async () => {
    if (!user) {
      alert("You must be logged in to add to cart.");
      return;
    }

    try {
      await addDoc(collection(db, "cart"), {
        userId: user.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        photo: product.photo,
        farmerId: product.farmerId,
        quantity: 1,
        createdAt: new Date(),
      });
      alert("Product added to cart!");
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Failed to add to cart.");
    }
  };

  const handleOrderNow = async () => {
    if (!user) {
      alert("You must be logged in to order.");
      return;
    }

    try {

      await addDoc(collection(db, "orders"), {
        buyerId: user.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        farmerId: product.farmerId,
        status: "pending",
        createdAt: new Date(),
      });
      alert("Order placed successfully!");
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Failed to place order.");
    }
  };

  if (loading)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
      {product?.photo ? (
  <img
    src={product.photo}
    alt={product.name}
    className="w-full h-52 object-cover rounded-lg"
  />
) : (
  <div className="w-full h-52 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg">
    No image available
  </div>
)}
          <p className="text-lg font-semibold">
            Price: <span className="font-normal">₱{product?.price}</span>
          </p>

          {/* Farmer Info */}
          {farmer ? (
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="font-semibold mb-1">Farmer Details</h3>
              <p>
                <strong>Name:</strong> {farmer.name || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {farmer.email || "N/A"}
              </p>
              <p>
                <strong>Average Rating:</strong>{" "}
                {avgRating !== null ? `${avgRating} ⭐` : "No ratings yet"}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Farmer details not found.</p>
          )}

          <div className="flex justify-end gap-3 mt-3">
            <Button onClick={handleAddToCart}>Add to Cart</Button>
            <Button onClick={handleOrderNow} className="bg-green-600">
              Order Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsDialog;
