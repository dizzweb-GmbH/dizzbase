SELECT  "order".*, "customer".*, "seller"."employee_name", "seller"."employee_email", "consultant"."employee_name" FROM "order" AS "order" JOIN "customer" AS "customer" ON "customer"."customer_id"="order"."customer_id"  JOIN "employee" AS "seller" ON "seller"."employee_id"="order"."sales_rep_id"  JOIN "employee" AS "consultant" ON "consultant"."employee_id"="order"."services_rep_id"  WHERE ("order"."order_revenue">= '100') AND ("seller"."employee_name"= 'ralph')  ORDER BY "order"."order_id" DESC , "seller"."employee_name" ASC 