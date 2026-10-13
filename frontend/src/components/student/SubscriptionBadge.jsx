/**
 * Small coloured badge that reports a student's subscription state.
 *
 * Placed on student cards so an admin can tell whether a subscription is
 * active without opening the student's details page.
 */
export default function SubscriptionBadge({ isSubscribed }) {
  return (
    <span
      className={`subscription-badge ${
        isSubscribed ? 'subscription-badge--on' : 'subscription-badge--off'
      }`}
    >
      {isSubscribed ? 'subscribed' : 'unsubscribed'}
    </span>
  )
}
