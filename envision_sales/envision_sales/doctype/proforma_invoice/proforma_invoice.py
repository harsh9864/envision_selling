# Copyright (c) 2024, Dhruvil Mistry and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class ProformaInvoice(Document):
    pass
@frappe.whitelist()
def update_outstanding_total_in_SO():
    try:
        sales_order = frappe.form_dict.get("sales_order")
        grand_total = frappe.form_dict.get("grand_total")

        # Check if sales_order and grand_total are provided
        if not sales_order or not grand_total:
            frappe.response["message"] = "Error- Sales Order or Grand Total not provided"

        # Fetch the Sales Order document
        sales_order_doc = frappe.get_doc("Sales Order", sales_order)

        # Ensure that the custom_outstanding_total field exists and is valid
        if sales_order_doc.custom_outstanding_total is None:
            frappe.response["message"] = "Error- Custom Outstanding Total field not set in Sales Order"

        # Calculate the updated outstanding amount
        custom_outstanding_total = float(sales_order_doc.custom_outstanding_total) - float(grand_total)
        # Ensure the new outstanding amount is not negative
        if custom_outstanding_total < 0:
            frappe.response["message"] = "Error - Custom Outstanding Total cannot be negative"
        else:
            # Update the custom_outstanding_total field
            sales_order_doc.db_set("custom_outstanding_total", custom_outstanding_total)
            # Commit the changes to the database
            frappe.db.commit()
            frappe.response["message"] = "Success"

    except Exception as e:
        frappe.log_error(message=str(e), title="Error in updating Sales Order Outstanding Amount")
        return {"success": False, "error": _("An error occurred: {0}").format(str(e))}
