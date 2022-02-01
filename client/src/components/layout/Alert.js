import React from "react";
import { useSelector } from "react-redux";

export default function Alert() {
	const alerts = useSelector((state) => state.alert);

	const alertMessage = alerts.map((alert) => (
		<div
			key={alert.id}
			className={`alert alert-wrapper alert-${alert.alertType}`}
		>
			{alert.msg}
		</div>
	));

	return alertMessage;
}
