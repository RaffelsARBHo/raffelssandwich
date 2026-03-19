//app/api/accurate/products/[id]/route.ts
import { accurateFetch } from '@/lib/accurate';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const id = params.id;

  if (!id || id === 'undefined') {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid item ID',
      },
      { status: 400 }
    );
  }

  try {
    const detailResponse = await accurateFetch(
      `/accurate/api/item/detail.do?id=${id}`
    );

    if (!detailResponse.s) {
      console.warn(`⚠️  Item detail API returned error:`, detailResponse.d);
      return NextResponse.json(
        {
          success: false,
          error: detailResponse.d || 'Failed to fetch item detail',
        },
        { status: 404 }
      );
    }

    const itemData = detailResponse.d;

    // Extract essential order and customer-facing details
    const essentialDetails = {
      // Basic Item Info
      id: itemData.id || null,
      no: itemData.no || null,
      name: itemData.name || null,
      shortName: itemData.shortName || null,
      itemType: itemData.itemType || null,
      itemTypeName: itemData.itemTypeName || null,

      // Pricing
      unitPrice: itemData.unitPrice || 0,
      cost: itemData.cost || 0,
      vendorPrice: itemData.vendorPrice || 0,

      // Unit Information
      unit1: {
        id: itemData.unit1?.id || null,
        name: itemData.unit1?.name || null,
      },
      unit1Name: itemData.unit1Name || null,

      // Stock/Inventory
      balance: itemData.balance || 0,
      balanceInUnit: itemData.balanceInUnit || null,
      availableToSell: itemData.availableToSell || 0,
      availableToSellInAllUnit: itemData.availableToSellInAllUnit || null,
      controlQuantity: itemData.controlQuantity || false,
      minimumQuantity: itemData.minimumQuantity || 0,
      minimumSellingQuantity: itemData.minimumSellingQuantity || 0,

      // Category
      itemCategory: {
        id: itemData.itemCategory?.id || null,
        name: itemData.itemCategory?.name || null,
      },

      // Tax
      percentTaxable: itemData.percentTaxable || 0,
      tax1: itemData.tax1 || null,
      tax2: itemData.tax2 || null,

      // Status
      suspended: itemData.suspended || false,
      onSales: itemData.onSales || 0,

      // Notes & Description
      notes: itemData.notes || null,

      // Images - NOW PROXIED
      images:
        itemData.detailItemImage?.map((img: any) => ({
          id: img.id || null,
          // Proxy the image URLs through our authenticated endpoint
          fileName: img.fileName 
            ? `/api/accurate/image?path=${encodeURIComponent(img.fileName)}`
            : null,
          thumbnailPath: img.thumbnailPath 
            ? `/api/accurate/image?path=${encodeURIComponent(img.thumbnailPath)}`
            : null,
          originalName: img.originalName || null,
          seq: img.seq || 0,
        })) || [],

      // Primary thumbnail for product card
      thumbnail: itemData.detailItemImage?.[0]?.thumbnailPath
        ? `/api/accurate/image?path=${encodeURIComponent(itemData.detailItemImage[0].thumbnailPath)}`
        : null,

      // Selling Prices (by branch/category)
      sellingPrices:
        itemData.detailSellingPrice?.map((sp: any) => ({
          price: sp.price || 0,
          effectiveDate: sp.effectiveDate || null,
          effectiveDateView: sp.effectiveDateView || null,
          unit: {
            id: sp.unit?.id || null,
            name: sp.unit?.name || null,
          },
          priceCategory: {
            id: sp.priceCategory?.id || null,
            name: sp.priceCategory?.name || null,
            defaultCategory: sp.priceCategory?.defaultCategory || false,
          },
          currency: {
            id: sp.currency?.id || null,
            code: sp.currency?.code || null,
            symbol: sp.currency?.symbol || null,
            name: sp.currency?.name || null,
          },
          branch: {
            id: sp.branch?.id || null,
            name: sp.branch?.name || null,
            defaultBranch: sp.branch?.defaultBranch || false,
          },
        })) || [],

      // Warehouse Data
      warehouses:
        itemData.detailWarehouseData?.map((wh: any) => ({
          id: wh.id || null,
          name: wh.name || null,
          warehouseName: wh.warehouseName || null,
          balance: wh.balance || 0,
          balanceUnit: wh.balanceUnit || null,
          defaultWarehouse: wh.defaultWarehouse || false,
          unit1Quantity: wh.unit1Quantity || 0,
        })) || [],

      // Additional Info
      upcNo: itemData.upcNo || null,
      weight: itemData.weight || 0,
      dimensions: {
        width: itemData.dimWidth || 0,
        height: itemData.dimHeight || 0,
        depth: itemData.dimDepth || 0,
      },

      // Brand
      itemBrand: itemData.itemBrand || null,
      itemBrandId: itemData.itemBrandId || null,

      // Preferred Vendor
      preferedVendor: itemData.preferedVendor || null,
      preferedVendorId: itemData.preferedVendorId || null,
    };

    return NextResponse.json({
      success: true,
      data: essentialDetails,
    });
  } catch (err: any) {
    console.error(`❌ Error fetching item detail for id ${id}:`, err.message);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}