package models

import (
    "context"
    "time"
    "garbage_trucks/backend/internal/database"
)

type Route struct {
    ID           int              `json:"id"`
    DriverID     int              `json:"driver_id"`
    PointID      int              `json:"point_id"`
    OrderNumber  int              `json:"order_number"`
    ScheduledAt  time.Time        `json:"scheduled_at"`
    Status       string           `json:"status"`
    CompletedAt  *time.Time       `json:"completed_at,omitempty"`
    Comment      *string          `json:"comment,omitempty"`
    Point        *CollectionPoint `json:"point"`
}

func GetRoutesByDriverID(ctx context.Context, driverID int) ([]Route, error) {
    rows, err := database.Pool.Query(ctx, `
        SELECT 
            r.id, r.driver_id, r.point_id, r.order_number,
            r.scheduled_at, r.status, r.completed_at, r.comment,
            cp.name, cp.address, cp.latitude, cp.longitude, cp.city
        FROM routes r
        JOIN collection_points cp ON r.point_id = cp.id
        WHERE r.driver_id = $1
        ORDER BY r.order_number
    `, driverID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var routes []Route
    for rows.Next() {
        var r Route
        var completedAt *time.Time
        var comment *string
        var cpName, cpAddress, cpCity string
        var cpLat, cpLon float64

        err := rows.Scan(
            &r.ID, &r.DriverID, &r.PointID, &r.OrderNumber,
            &r.ScheduledAt, &r.Status, &completedAt, &comment,
            &cpName, &cpAddress, &cpLat, &cpLon, &cpCity,
        )
        if err != nil {
            return nil, err
        }

        r.CompletedAt = completedAt
        r.Comment = comment
        r.Point = &CollectionPoint{
            ID:        r.PointID,
            Name:      cpName,
            Address:   cpAddress,
            Latitude:  cpLat,
            Longitude: cpLon,
            City:      cpCity,
        }

        routes = append(routes, r)
    }

    return routes, rows.Err()
}

func UpdateRouteStatus(ctx context.Context, routeID int, status string) error {
    _, err := database.Pool.Exec(ctx, `
        UPDATE routes 
        SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
        WHERE id = $2
    `, status, routeID)
    return err
}

func GetRoutesByPointID(ctx context.Context, pointID int) ([]Route, error) {
    rows, err := database.Pool.Query(ctx, `
        SELECT 
            r.id, r.driver_id, r.point_id, r.order_number,
            r.scheduled_at, r.status, r.completed_at, r.comment
        FROM routes r
        WHERE r.point_id = $1
        ORDER BY r.driver_id
    `, pointID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var routes []Route
    for rows.Next() {
        var r Route
        err := rows.Scan(
            &r.ID, &r.DriverID, &r.PointID, &r.OrderNumber,
            &r.ScheduledAt, &r.Status, &r.CompletedAt, &r.Comment,
        )
        if err != nil {
            return nil, err
        }
        routes = append(routes, r)
    }

    return routes, rows.Err()
}