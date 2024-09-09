import frappe

@frappe.whitelist()
def create_proforma_invoice(sales_order):
    sales_order_doc = frappe.get_doc("Sales Order", sales_order)
    income_account = frappe.db.get_value("Company", sales_order_doc.company, "default_income_account")
    expense_account = frappe.db.get_value("Company", sales_order_doc.company, "default_expense_account")
    debit_to = frappe.db.get_value("Company", sales_order_doc.company, "default_receivable_account")
    
    proforma_invoice = frappe.get_doc({
        "doctype": "Proforma Invoice",
        "customer": sales_order_doc.customer,
        "sales_order": sales_order_doc.name,
        "grand_total": sales_order_doc.total,
        "total": sales_order_doc.total,
        "net_total": sales_order_doc.total,
        "base_grand_total":sales_order_doc.total,
        "due_date":sales_order_doc.delivery_date,
        "project": sales_order_doc.project,
        "cost_center": sales_order_doc.cost_center,
        "debit_to":debit_to,
        "company": sales_order_doc.company,
        "total_qty": sales_order_doc.total_qty,
        "po_no":sales_order_doc.po_no,
        "po_date":sales_order_doc.po_date,
        "items": [
            {
                "item_code": item.item_code,
                "item_name": item.item_name,
                "amount": item.base_amount,
                "base_amount": item.base_amount,
                "uom": item.uom,
                "description": item.description,
                "conversion_factor": item.conversion_factor,
                "image": item.image,
                "gst_hsn_code": item.gst_hsn_code,
                "qty": item.qty,
                "rate": item.rate,
                "base_rate": item.base_rate,
                "stock_uom": item.stock_uom,
                "sales_order": sales_order_doc.name,
                "income_account": income_account,
                "expense_account": expense_account,
                
            }
            for item in sales_order_doc.items
        ],
        "sales_order": sales_order_doc.name,
        "customer_address": sales_order_doc.customer_address,
        "address_display": sales_order_doc.address_display,
        "contact_person": sales_order_doc.contact_person,
        "contact_display": sales_order_doc.contact_display,
        "contact_mobile": sales_order_doc.contact_mobile,
        "contact_email": sales_order_doc.contact_email,
        "shipping_address": sales_order_doc.shipping_address,
        "dispatch_address": sales_order_doc.dispatch_address,
        "company_address_display": sales_order_doc.company_address_display,
        "territory": sales_order_doc.territory,
        "shipping_address_name": sales_order_doc.shipping_address_name,
        "dispatch_address_name": sales_order_doc.dispatch_address_name,
        "company_address": sales_order_doc.company_address,
    })

    proforma_invoice.insert()
    return proforma_invoice.name

@frappe.whitelist()
def create_sales_invoice(proforma_invoice):
    proforma_invoice_doc = frappe.get_doc("Proforma Invoice", proforma_invoice)
    income_account = frappe.db.get_value("Company", proforma_invoice_doc.company, "default_income_account")
    expense_account = frappe.db.get_value("Company", proforma_invoice_doc.company, "default_expense_account")
    debit_to = frappe.db.get_value("Company", proforma_invoice_doc.company, "default_receivable_account")
    
    sales_invoice = frappe.get_doc({
        "doctype": "Sales Invoice",
        "customer": proforma_invoice_doc.customer,
        "grand_total": proforma_invoice_doc.total,
        "total": proforma_invoice_doc.total,
        "net_total": proforma_invoice_doc.total,
        "base_grand_total":proforma_invoice_doc.total,
        "due_date":proforma_invoice_doc.due_date,
        "project": proforma_invoice_doc.project,
        "cost_center": proforma_invoice_doc.cost_center,
        "debit_to":debit_to,
        "company": proforma_invoice_doc.company,
        "total_qty": proforma_invoice_doc.total_qty,
        "items": [
            {
                "item_code": item.item_code,
                "item_name": item.item_name,
                "amount": item.base_amount,
                "base_amount": item.base_amount,
                "uom": item.uom,
                "description": item.description,
                "conversion_factor": item.conversion_factor,
                "image": item.image,
                "gst_hsn_code": item.gst_hsn_code,
                "qty": item.qty,
                "rate": item.rate,
                "base_rate": item.base_rate,
                "stock_uom": item.stock_uom,
                "income_account": income_account,
                "expense_account": expense_account,
                "custom_proforma_invoice": proforma_invoice_doc.name,
                
            }
            for item in proforma_invoice_doc.items
        ],
        "custom_proforma_invoice": proforma_invoice_doc.name,
        "customer_address": proforma_invoice_doc.customer_address,
        "address_display": proforma_invoice_doc.address_display,
        "contact_person": proforma_invoice_doc.contact_person,
        "contact_display": proforma_invoice_doc.contact_display,
        "contact_mobile": proforma_invoice_doc.contact_mobile,
        "contact_email": proforma_invoice_doc.contact_email,
        "shipping_address": proforma_invoice_doc.shipping_address,
        "dispatch_address": proforma_invoice_doc.dispatch_address,
        "company_address_display": proforma_invoice_doc.company_address_display,
        "territory": proforma_invoice_doc.territory,
        "shipping_address_name": proforma_invoice_doc.shipping_address_name,
        "dispatch_address_name": proforma_invoice_doc.dispatch_address_name,
        "company_address": proforma_invoice_doc.company_address,
    })

    sales_invoice.insert()
    return sales_invoice.name