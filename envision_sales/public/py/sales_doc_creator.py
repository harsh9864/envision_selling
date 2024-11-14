import frappe
import json
@frappe.whitelist()
def create_proforma_invoice(sales_order):
    sales_order_doc = frappe.get_doc("Sales Order", sales_order)
    income_account = frappe.db.get_value("Company", sales_order_doc.company, "default_income_account")
    expense_account = frappe.db.get_value("Company", sales_order_doc.company, "default_expense_account")
    debit_to = frappe.db.get_value("Company", sales_order_doc.company, "default_receivable_account")
    
    proforma_invoice = frappe.get_doc({
        "doctype": "Proforma Invoice",
        "customer": sales_order_doc.customer,
        "department":sales_order_doc.department,
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
        "department":proforma_invoice_doc.department,
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
                "sales_order": proforma_invoice_doc.sales_order
                
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

@frappe.whitelist()
def get_items_from_proforma():
    lists = frappe.form_dict["list"]
    list1 = json.loads(lists)

    proformainvoicedata = frappe.db.sql("""
        SELECT PFII.item_code, PFII.item_name, PFII.uom, PFII.qty, PFII.rate, PFII.amount, PFII.conversion_factor, PFII.parent
        FROM `tabSales Invoice Item` AS PFII
        INNER JOIN `tabUOM Conversion Detail` AS UOM
        ON UOM.parent = PFII.item_code
        WHERE PFII.parent IN %s
        """
        ,(list1,),
        as_dict=True,
    )
    frappe.response["data"] = proformainvoicedata

@frappe.whitelist()
def create_payment_entry():
    proforma_invoice_doc: Dict[str,Any] = frappe.get_doc("Proforma Invoice", frappe.form_dict["proforma_invoice"])
    amount: float = frappe.form_dict["amount"]
    sales_order:  Dict[str,Any] = frappe.form_dict["sales_order"]
    company:  Dict[str,Any] = frappe.get_doc("Company", proforma_invoice_doc.company)
    customer:  Dict[str,Any] = frappe.get_doc("Customer", proforma_invoice_doc.customer)
    customer_default_account: str = company.default_cash_account
    print(f"\n\n{company.name} {company.default_cash_account}\n\n")
    for account in customer.accounts:
        if account.company == company.name:
            customer_default_account = account.account
    print(f"\n\n{customer_default_account} {company.default_cash_account}\n\n")
    # Create new Payment Entry
    payment_entry_doc = frappe.new_doc("Payment Entry")

    # Main Payment Entry fields
    payment_entry_doc.payment_type = "Receive"
    payment_entry_doc.mode_of_payment = "Cash"
    payment_entry_doc.payment_date = proforma_invoice_doc.due_date
    payment_entry_doc.party_type = "Customer"
    payment_entry_doc.party = proforma_invoice_doc.customer
    payment_entry_doc.paid_from = proforma_invoice_doc.debit_to
    payment_entry_doc.paid_to = customer_default_account
    payment_entry_doc.paid_amount = float(amount) 
    payment_entry_doc.posting_date = proforma_invoice_doc.due_date
    payment_entry_doc.received_amount = float(amount)  
    payment_entry_doc.company = proforma_invoice_doc.company
    payment_entry_doc.target_exchange_rate = 1
    payment_entry_doc.custom_is_payment_against_proforma_invoice = 1
    payment_entry_doc.custom_proforma_invoice = proforma_invoice_doc.name
    # Add references to the child table with numeric allocated_amount
    payment_entry_doc.append("references", {
        "reference_doctype": "Sales Order",
        "reference_name": sales_order,
        "due_date": proforma_invoice_doc.due_date,
        "allocated_amount": float(amount)  
    })

    # Insert the document into the database
    payment_entry_doc.insert()
    payment_entry_doc.save()
    # updating_proforma_invoice_outstanding_amount(proforma_invoice_doc, float(amount) * -1)
    frappe.msgprint(f"Payment Entry {payment_entry_doc.name} created successfully.")

    return payment_entry_doc.name

@frappe.whitelist()
def updating_proforma_invoice_outstanding_amount(proforma_invoice, amount):
    proforma_invoice_doc = frappe.get_doc("Proforma Invoice", proforma_invoice)
    frappe.db.set_value("Proforma Invoice", proforma_invoice, "outstanding_amount", float(proforma_invoice_doc.outstanding_amount) + float(amount))
    frappe.db.commit()