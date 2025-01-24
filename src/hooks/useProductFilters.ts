import { useState } from 'react';

interface Product {
  price: number;
  category: string;
  distance?: number;
}

export const useProductFilters = () => {
  const [sortBy, setSortBy] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [distanceRange, setDistanceRange] = useState("all");

  const filterProducts = <T extends Product>(products: T[]): T[] => {
    let filteredProducts = [...products];

    // Apply price range filter
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      filteredProducts = filteredProducts.filter(
        product => product.price >= min && (max ? product.price <= max : true)
      );
    }

    // Apply category filter
    if (category !== "all") {
      filteredProducts = filteredProducts.filter(
        product => product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply distance filter
    if (distanceRange !== "all") {
      const maxDistance = parseInt(distanceRange);
      filteredProducts = filteredProducts.filter(
        product => product.distance && product.distance <= maxDistance
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "distance":
        filteredProducts.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        break;
    }

    return filteredProducts;
  };

  return {
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    category,
    setCategory,
    distanceRange,
    setDistanceRange,
    filterProducts,
  };
};