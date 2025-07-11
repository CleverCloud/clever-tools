# Clever Cloud services: notifications and hooks

When events happen on Clever Cloud, during add-ons or applications lifecycle for example, you can send email notifications or trigger webhooks. For each of the following command, you can list all items and/or target a specific user/organisation through these parameters:

```
[--org, -o, --owner]       Organisation ID (or name, if unambiguous)
[--list-all]               List all notifications for your user or for an organisation with the `--org` option (default: false)
```

## notify-email

You can send email notifications when an event occurs. To list them, use:

```
clever notify-email
clever notify-email --format json
```

To add a notification process to an application, use:

```
clever notify-email add --notify <EMAIL_ADDRESS>|<USER_ID>|"ORGANISATION" NAME
```

Available options are:

```
[--event] TYPE                                        Restrict notifications to specific event types
[--service] SERVICE_ID                                Restrict notifications to specific applications and add-ons
--notify <EMAIL_ADDRESS>|<USER_ID>|"ORGANISATION"     Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)
```

To delete a notification process, use:

```
clever notify-email remove NOTIFICATION-ID
```

## webhooks

You can trigger webhooks when an event occurs. To list them, use:

```
clever webhooks -F json
```

To add a webhook to an application, use:

```
clever webhooks add NAME URL
```

You can set the format, restrict to a service or event types through these parameters:

```
[--format] FORMAT          Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock') (default: raw)
[--event] TYPE             Restrict notifications to specific event types
[--service] SERVICE_ID     Restrict notifications to specific applications and add-ons
```

To delete a webhook, use:

```
clever webhooks remove NOTIFICATION-ID
```
