# Copyright (c) 2024, Dhruvil Mistry and contributors
# For license information, please see license.txt

import frappe
from typing import List, Dict, Any

def execute(filters=None):
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns() -> List[Dict[str,Any]]:
	columns: List[Dict[str,Any]] = [
		{
			"label": "<b>Customer</b>",
			"fieldname":"Party",
			"fieldtype":"Link",
			"options": "Customer",
			"width":275,
		},
		{
			"label": "<b>W.O. Date</b>",
			"fieldname":"W.O. Date",
			"fieldtype":"Date",
			"width":150,
		},
		{
			"label": "<b>W.O. Order</b>",
			"fieldname":"Work Order ID",
			"fieldtype":"Link",
			"options": "Sales Order",
			"width":200,
		},
		{
			"label": "<b>W.O. Value</b>",
			"fieldname":"W.O. Value",
			"fieldtype":"Currency",
			"width":150,
		},
		{
			"label": "<b>PI/s</b>",
			"fieldname":"Proforma Invoice IDs",
			"fieldtype":"Link",
			"options": "Proforma Invoice",
			"width":200,
		},
		{
			"label": "<b>TI/s</b>",
			"fieldname":"Sales Invoice IDs",
			"fieldtype":"Link",
			"options": "Sales Invoice",
			"width":200,
		},
		{
			"label": "<b>Date of Invoice</b>",
			"fieldname":"Date of Invoice",
			"fieldtype":"Date",
			"width":150,
		},
		{
			"label": "<b>Total PI</b>",
			"fieldname":"Total PI",
			"fieldtype":"Currency",
			"width":150,
		},
		{
			"label": "<b>Total TI</b>",
			"fieldname":"Total TI",
			"fieldtype":"Currency",
			"width":150,
		},
		{
			"label": "<b>Paid Amount</b>",
			"fieldname":"Paid Amount",
			"fieldtype":"Currency",
			"width":150,
		},
		{
			"label": "<b>Total Outstanding Amount</b>",
			"fieldname":"Total Outstanding Amount",
			"fieldtype":"Currency",
			"width":150,
		},
		{
			"label": "<b>Aging</b>",
			"fieldname":"Aging",
			"fieldtype":"Data",
			"width":150,
		},
		{
			"label": "<b>Payment Entry</b>",
			"fieldname":"Payment Entry",
			"fieldtype":"Link",
			"options": "Payment Entry",
			"width":200,
		},
		{
			"label": "<b>PFI</b>",
			"fieldname":"PFI",
			"fieldtype":"Data",
			'hidden': 1,
		},
		{
			"label": "<b>SI</b>",
			"fieldname":"SI",
			"fieldtype":"Data",
			'hidden': 1,
		},
	] 
	return columns


def get_data(filters=None) -> List[Dict[str, Any]]:
	company: str = filters.get("company", "")
	customer: str = filters.get("customer", "")
	from_date: str = filters.get("from_date", "")
	to_date: str = filters.get("to_date", "")
	voucher_type: str = filters.get("voucher_type", "")
	voucher_id: str = filters.get("id", "")
	aging_type: str = filters.get("aging_type", "")
	print(f"{aging_type}")

	# Base SQL query
	# SO  ->  Sales Order
	# PFI ->  Proforma Invoice
	# SI  ->  Sales Invoice
	# PR  ->  Payment Entry
	# PER ->  Payment Entry Reference

	base_query = f"""
		SELECT 
			SO.customer AS "Party",
			SO.transaction_date AS "W.O. Date",
			SO.name AS "Work Order ID",
			SO.total AS "W.O. Value",
			IFNULL(PFI.name, "Pending") AS "Proforma Invoice IDs",
			IFNULL(SI.name, "Pending") AS "Sales Invoice IDs",
			IFNULL(SI.posting_date, "-") AS "Date of Invoice",
			IFNULL(PFI.total, 0.00) AS "Total PI",
			IFNULL(SI.grand_total, 0.00) AS "Total TI",
			IFNULL(SI.outstanding_amount, 0.00) AS "Total Outstanding Amount",
			CASE
				WHEN PR.name IS NOT NULL AND PER.allocated_amount != 0 THEN PR.name
				WHEN PR.name IS NULL THEN "Not Paid"
			END AS "Payment Entry",
			IFNULL(PER.allocated_amount,0) AS "Paid Amount",
			PFI.docstatus AS "PFI",
			SI.docstatus AS "SI",
			CASE
				WHEN SI.name IS NOT NULL AND SI.outstanding_amount = 0 THEN 0
				WHEN SI.name IS NOT NULL AND SI.outstanding_amount > 0 THEN DATEDIFF(CURDATE(), DATE(SI.creation))
				ELSE "Not Initialized" 
			END AS "Aging"
		FROM `tabSales Order` AS SO
		LEFT JOIN `tabProforma Invoice` AS PFI ON PFI.sales_order = SO.name
		LEFT JOIN `tabSales Invoice Item` AS SII ON PFI.name = SII.custom_proforma_invoice
		LEFT JOIN `tabSales Invoice` AS SI ON SI.name = SII.parent
		LEFT JOIN `tabPayment Entry Reference` AS PER ON (PER.reference_name = SI.name OR PER.reference_name = SO.name)
		LEFT JOIN `tabPayment Entry` AS PR ON PR.name = PER.parent
		WHERE SO.docstatus = 1
		AND (SO.company = "{company}" OR "{company}" = "")
		AND (SO.customer = "{customer}" OR "{customer}" = "")
		AND (SO.transaction_date BETWEEN "{from_date}" AND "{to_date}" OR ("{from_date}" = "" AND "{to_date}" = ""))
		
	"""
	filter_condition = ""
	# Apply voucher_type filter
	if voucher_type == "Sales Order" and voucher_id:
		filter_condition += f"""AND SO.name = '{voucher_id}' GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif voucher_type == "Proforma Invoice" and voucher_id:
		filter_condition += f"""AND PFI.name = '{voucher_id}' GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif voucher_type == "Sales Invoice" and voucher_id:
		filter_condition += f"""AND SI.name = '{voucher_id}' GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif voucher_type == "Payment Entry" and voucher_id:
		filter_condition += f"""AND PR.name = '{voucher_id}' GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""

	# Apply aging_type filter
	elif aging_type == "":
		filter_condition += """GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif aging_type == "Less than 30":
		filter_condition += """AND (SI.outstanding_amount > 0 AND DATEDIFF(CURDATE(), DATE(SI.creation)) < 30)
		GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif aging_type == "Greater than 30":
		filter_condition += """AND (SI.outstanding_amount > 0 AND DATEDIFF(CURDATE(), DATE(SI.creation)) >= 30)
		GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif aging_type == "Greater than 60":
		filter_condition += """AND (SI.outstanding_amount > 0 AND DATEDIFF(CURDATE(), DATE(SI.creation)) >= 60)
		GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif aging_type == "Greater than 90":
		filter_condition += """AND (SI.outstanding_amount > 0 AND DATEDIFF(CURDATE(), DATE(SI.creation)) >= 90)
		GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif aging_type == "Greater than 120":
		filter_condition += """AND (SI.outstanding_amount > 0 AND DATEDIFF(CURDATE(), DATE(SI.creation)) >= 120)
		GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	elif aging_type == "Greater than 180":
		filter_condition += """AND (SI.outstanding_amount > 0 AND DATEDIFF(CURDATE(), DATE(SI.creation)) >= 180)
		GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	else:
		filter_condition += """GROUP BY SO.name, PFI.name, SI.name,PR.name
		ORDER BY SO.creation DESC"""
	
	# Complete SQL query with filter condition
	complete_query = base_query + filter_condition
	
	# Execute the query
	result_data = frappe.db.sql(complete_query, as_dict=1)

	return result_data

