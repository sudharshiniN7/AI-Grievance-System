import { useState } from "react";
import { Link } from "react-router-dom";
import "./PassengerNotifications.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: "n1",
    complaintId: "GR-20481",
    title: "Status updated to Under Review",
    description: "Station Maintenance has started inspecting the reported coach.",
    time: "2 hours ago",
    type: "info",
    read: false,
  },
  {
    id: "n2",
    complaintId: "GR-20481",
    title: "Complaint assigned",
    description: "Your complaint was forwarded to Station Maintenance — Chennai Division.",
    time: "1 day ago",
    type: "info",
    read: false,
  },
  {
    id: "n3",
    complaintId: "GR-20463",
    title: "Complaint resolved",
    description: "Staff Behaviour complaint marked as resolved. Please rate your experience.",
    time: "3 days ago",
    type: "success",
    read: true,
  },
  {
    id: "n4",
    complaintId: "GR-20440",
    title: "Complaint rejected",
    description: "Insufficient details provided. You may file a new complaint with more evidence.",
    time: "1 week ago",
    type: "error",
    read: true,
  },
  {
    id: "n5",
    complaintId: "GR-20481",
    title: "AI analysis completed",
    description: "Categorised as Cleanliness with Medium priority.",
    time: "1 week ago",
    type: "info",
    read: true,
  },
];

function iconForType(type) {
  if (type === "success") return "✓";
  if (type === "error") return "✕";
  return "●";
}

function PassengerNotifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div className="page-header notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Updates on your complaints, as they happen.</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.map((n) => (
          <Link
            to={`/complaints/${n.complaintId}`}
            key={n.id}
            className={
              "card notification-item" + (!n.read ? " notification-item-unread" : "")
            }
            onClick={() => markRead(n.id)}
          >
            <span className={`notification-icon notification-icon-${n.type}`}>
              {iconForType(n.type)}
            </span>
            <div className="notification-content">
              <div className="notification-title-row">
                <h3>{n.title}</h3>
                <span>{n.time}</span>
              </div>
              <p>{n.description}</p>
              <span className="notification-complaint-ref">{n.complaintId}</span>
            </div>
            {!n.read && <span className="notification-dot" aria-label="Unread" />}
          </Link>
        ))}

        {notifications.length === 0 && (
          <div className="card notifications-empty">
            <p>You're all caught up — no notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PassengerNotifications;