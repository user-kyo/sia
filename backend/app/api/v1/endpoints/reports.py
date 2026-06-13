import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from collections import defaultdict, Counter

from fastapi import APIRouter, Depends, Query, HTTPException
from app.api.deps import get_current_user
from app.db.supabase import supabase_client

router = APIRouter()

@router.get("/chart")
def get_report_chart(type: str = Query(...), current_user: dict = Depends(get_current_user)):
    if not supabase_client:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
        
    company_id = current_user.get("company_id")
    if not company_id:
        # For super admin viewing all, we might skip company_id filter, but for safety let's use it if present
        pass

    fig, ax = plt.subplots(figsize=(8, 4))
    
    try:
        if type == "inventory":
            query = supabase_client.table("inventory").select("name,quantity")
            if company_id:
                query = query.eq("company_id", company_id)
            result = query.order("quantity", desc=True).limit(10).execute()
            data = result.data or []
            names = [d.get("name", "Unknown")[:15] + "..." if len(d.get("name", "")) > 15 else d.get("name", "Unknown") for d in data]
            quantities = [d.get("quantity", 0) for d in data]
            if names:
                ax.bar(names, quantities, color='#4f46e5') # indigo-600
                ax.set_title("Top 10 Inventory Items by Quantity")
                ax.set_ylabel("Stock Quantity")
                plt.xticks(rotation=45, ha='right')
            else:
                ax.text(0.5, 0.5, "No Inventory Data", ha='center', va='center')

        elif type == "sales":
            query = supabase_client.table("sales_transactions").select("created_at,total_amount")
            if company_id:
                query = query.eq("company_id", company_id)
            result = query.order("created_at", desc=True).limit(100).execute()
            data = result.data or []
            
            daily = defaultdict(float)
            for d in data:
                date_str = d.get("created_at", "")[:10]
                if date_str:
                    daily[date_str] += float(d.get("total_amount", 0))
            
            if daily:
                sorted_dates = sorted(daily.keys())
                amounts = [daily[d] for d in sorted_dates]
                ax.plot(sorted_dates, amounts, marker='o', color='#10b981', linewidth=2) # emerald-500
                ax.set_title("Recent Sales Revenue (Last 100 Transactions)")
                ax.set_ylabel("Revenue")
                plt.xticks(rotation=45, ha='right')
                plt.grid(True, linestyle='--', alpha=0.5)
            else:
                ax.text(0.5, 0.5, "No Sales Data", ha='center', va='center')

        elif type == "procurements":
            query = supabase_client.table("procurements").select("status")
            if company_id:
                query = query.eq("company_id", company_id)
            result = query.execute()
            data = result.data or []
            
            counts = Counter(d.get("status", "Unknown") for d in data)
            if counts:
                labels = [k.replace('_', ' ').upper() for k in counts.keys()]
                sizes = list(counts.values())
                colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']
                ax.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90, colors=colors[:len(labels)])
                ax.set_title("Purchase Orders by Status")
                ax.axis('equal')
            else:
                ax.text(0.5, 0.5, "No Procurement Data", ha='center', va='center')
                
        elif type == "suppliers":
            query = supabase_client.table("suppliers").select("status")
            if company_id:
                query = query.eq("company_id", company_id)
            result = query.execute()
            data = result.data or []
            
            counts = Counter(d.get("status", "Unknown") for d in data)
            if counts:
                labels = [k.capitalize() for k in counts.keys()]
                sizes = list(counts.values())
                ax.bar(labels, sizes, color='#3b82f6', width=0.5) # blue-500
                ax.set_title("Suppliers by Status")
                ax.set_ylabel("Count")
            else:
                ax.text(0.5, 0.5, "No Supplier Data", ha='center', va='center')

        else:
            # Fallback for users, categories, brands
            ax.text(0.5, 0.5, f"Summary chart not available for {type.capitalize()}", ha='center', va='center')
            ax.axis('off')

    except Exception as e:
        print(f"Error generating chart for {type}: {e}")
        ax.text(0.5, 0.5, "Error generating chart", ha='center', va='center', color='red')
        ax.axis('off')

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100)
    plt.close(fig)
    
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"chart": f"data:image/png;base64,{encoded}"}
