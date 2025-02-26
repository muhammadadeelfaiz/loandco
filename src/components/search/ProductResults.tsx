
import { LocalProducts } from "./LocalProducts";
import { EbayProducts } from "./EbayProducts";
import { AmazonProducts } from "./AmazonProducts";

interface ProductResultsProps {
  filteredLocalProducts: any[];
  filteredEbayProducts: any[];
  amazonProducts: any[];
  isLoading: boolean;
  isLoadingEbay: boolean;
  isLoadingAmazon: boolean;
  query: string;
  onContactRetailer: (retailerName: string) => void;
  onGetDirections: (lat: number, lng: number, storeName: string) => void;
}

export const ProductResults = ({
  filteredLocalProducts,
  filteredEbayProducts,
  amazonProducts,
  isLoading,
  isLoadingEbay,
  isLoadingAmazon,
  query,
  onContactRetailer,
  onGetDirections,
}: ProductResultsProps) => {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Local Stores</h2>
        <LocalProducts
          products={filteredLocalProducts}
          isLoading={isLoading}
          onContactRetailer={onContactRetailer}
          onGetDirections={onGetDirections}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">eBay Products</h2>
        <EbayProducts 
          products={filteredEbayProducts}
          isLoading={isLoadingEbay}
        />
      </section>

      {query && (
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Amazon Products</h2>
          <AmazonProducts 
            products={amazonProducts}
            isLoading={isLoadingAmazon}
          />
        </section>
      )}
    </div>
  );
};
