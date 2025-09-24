# Stock Sales Analytics Dashboard API

## Overview

This redesigned dashboard focuses specifically on **stock sales analytics**, providing meaningful insights about:

- **Stock movement patterns** (what products are selling, when, and how much)
- **Sales personnel performance** (who sold what, when they sold it, and their performance trends)
- **Time-based analysis** (daily, weekly, monthly patterns throughout the year)
- **Trend analysis** (growth patterns and period comparisons)

The system analyzes sales data across daily, weekly, and monthly periods within a full year timeframe.

## Authentication

All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
/api/dashboard
```

## Main Endpoints

### 1. Sales Analytics Dashboard
**GET** `/analytics`

The primary endpoint providing comprehensive stock sales analytics with configurable periods.

#### Query Parameters
- `period` (optional): Analysis period - "daily", "weekly", or "monthly" (default: "daily")
- `year` (optional): Target year for analysis (default: current year)
- `country_uuid` (optional): Filter by specific country
- `province_uuid` (optional): Filter by specific province

#### Response Structure
```json
{
  "status": "success",
  "message": "Sales analytics for daily period in year 2025",
  "data": {
    "period": "daily",
    "date_range": {
      "start_date": "2025-01-01",
      "end_date": "2025-12-31",
      "days": 365
    },
    "stock_movement": {
      "total_quantity_sold": 15750,
      "total_sales_transactions": 1250,
      "average_quantity_per_sale": 12.6,
      "daily_average_quantity": 43.15,
      "peak_sales_date": "2025-03-15",
      "peak_sales_quantity": 285
    },
    "product_sales": [
      {
        "product_uuid": "uuid-123",
        "product_name": "Product A",
        "total_quantity_sold": 3500,
        "sales_count": 280,
        "average_per_sale": 12.5,
        "first_sale_date": "2025-01-05 09:30",
        "last_sale_date": "2025-09-24 16:45",
        "sales_by_period": [
          {
            "period": "2025-01-01",
            "period_label": "Jan 01",
            "quantity": 45,
            "sales_count": 4
          }
        ],
        "top_sellers": [
          {
            "user_uuid": "user-123",
            "user_name": "John Smith",
            "quantity": 450,
            "sales_count": 35,
            "last_sale_date": "2025-09-24 14:30"
          }
        ]
      }
    ],
    "sales_persons": [
      {
        "user_uuid": "user-123",
        "user_name": "John Smith",
        "user_title": "Senior Sales Rep",
        "total_quantity": 2100,
        "total_sales": 168,
        "average_per_day": 5.75,
        "performance_rank": 1,
        "products_sold": [
          {
            "product_uuid": "prod-123",
            "product_name": "Product A",
            "quantity": 450,
            "sales_count": 35,
            "last_sale_date": "2025-09-24 14:30"
          }
        ],
        "sales_by_period": [
          {
            "period": "2025-01-01",
            "period_label": "Jan 01",
            "quantity": 25,
            "sales_count": 2
          }
        ]
      }
    ],
    "trend_analysis": {
      "current_period_total": 15750,
      "previous_period_total": 14200,
      "growth_percentage": 10.92,
      "trend_direction": "up",
      "best_performing_day": "2025-03-15",
      "worst_performing_day": "2025-02-03"
    },
    "top_performers": {
      "top_product": {
        "product_uuid": "uuid-123",
        "product_name": "Product A",
        "total_quantity": 3500,
        "sales_count": 280
      },
      "top_sales_person": {
        "user_uuid": "user-123",
        "user_name": "John Smith",
        "total_quantity": 2100,
        "sales_count": 168
      },
      "top_province": {
        "province_uuid": "prov-123",
        "province_name": "California",
        "total_quantity": 5200,
        "sales_count": 420
      }
    }
  },
  "filters": {
    "period": "daily",
    "year": 2025,
    "country_uuid": "",
    "province_uuid": ""
  }
}
```

### 2. Stock Performance Summary
**GET** `/stock-performance`

Monthly breakdown of stock performance over a full year.

#### Query Parameters
- `year` (optional): Target year (default: current year)
- `country_uuid` (optional): Filter by country
- `province_uuid` (optional): Filter by province

#### Response
```json
{
  "status": "success",
  "message": "Stock performance summary for year 2025",
  "data": {
    "year": 2025,
    "monthly_data": [
      {
        "month": 1,
        "month_name": "January",
        "quantity_sold": 1250,
        "sales_count": 95
      },
      {
        "month": 2,
        "month_name": "February",
        "quantity_sold": 1180,
        "sales_count": 88
      }
    ]
  }
}
```

### 3. Additional Endpoints

The following endpoints remain available for compatibility:

- **GET** `/time-analysis` - Hourly breakdown analysis
- **GET** `/sales-comparison` - Period comparison analysis  
- **GET** `/real-time` - Live dashboard updates
- **GET** `/filters` - Available filter options
- **GET** `/team-overview` - Team member performance overview

## Key Features

### 📊 **Comprehensive Stock Analytics**

1. **Stock Movement Tracking**
   - Total quantities sold across all products
   - Average quantity per sale transaction
   - Daily average performance metrics
   - Peak sales identification by date

2. **Product Performance Analysis**
   - Individual product sales performance
   - Time-based sales patterns (daily/weekly/monthly)
   - Top sellers for each product
   - First and last sale tracking

3. **Sales Personnel Insights**
   - Individual performance rankings
   - Products sold by each person
   - Time-based performance patterns
   - Daily average calculations

4. **Trend Analysis**
   - Period-over-period growth calculations
   - Trend direction indicators (up/down/stable)
   - Best and worst performing periods
   - Growth percentage calculations

### 📈 **Period Analysis Options**

#### Daily Analysis (`period=daily`)
- Shows sales data broken down by individual days
- Ideal for tracking daily performance trends
- Shows day-to-day variations

#### Weekly Analysis (`period=weekly`)  
- Aggregates data by calendar weeks
- Shows weekly performance patterns
- Useful for identifying weekly trends

#### Monthly Analysis (`period=monthly`)
- Groups data by calendar months  
- Shows seasonal trends and patterns
- Best for long-term trend analysis

### 🎯 **Focused Information Display**

The dashboard now provides **meaningful insights** instead of generic metrics:

1. **Who sold what and when** - Complete visibility into sales personnel performance
2. **Stock movement patterns** - Understanding which products move and when
3. **Performance comparisons** - Year-over-year and period-over-period analysis
4. **Trend identification** - Growth patterns and performance indicators

## API Usage Examples

### Get Daily Sales Analytics for Current Year
```http
GET /api/dashboard/analytics?period=daily
```

### Get Monthly Analysis for Specific Year and Country
```http
GET /api/dashboard/analytics?period=monthly&year=2025&country_uuid=uuid-123
```

### Get Weekly Performance for Specific Province
```http
GET /api/dashboard/analytics?period=weekly&province_uuid=uuid-456
```

### Get Stock Performance Summary
```http
GET /api/dashboard/stock-performance?year=2025
```

## Data Insights Provided

### 🏆 **Top Performers**
- Best performing product by quantity sold
- Top sales person by total quantity
- Most productive province/region
- Peak performance periods

### 📋 **Detailed Product Analysis**
- Sales count and total quantity for each product
- Average quantity per sale
- Sales timeline (first sale to most recent)
- Top sellers for each product
- Period-based performance breakdown

### 👤 **Sales Personnel Performance**
- Performance ranking system
- Products sold by each person
- Daily average productivity
- Period-based performance tracking
- Individual product specialization

### 📊 **Stock Movement Intelligence**
- Overall stock turnover metrics
- Peak sales period identification
- Daily average calculations
- Transaction frequency analysis

## Frontend Integration

This focused approach provides exactly what managers need:

1. **Clear performance metrics** - Who is selling what and how much
2. **Time-based insights** - When sales happen and trending patterns
3. **Product intelligence** - Which products perform best and why
4. **Trend analysis** - Growth patterns and performance comparisons
5. **Actionable data** - Information that can drive business decisions

The API returns rich, structured data that can be easily visualized in charts, tables, and performance dashboards on the frontend.