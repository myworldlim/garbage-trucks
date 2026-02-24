package models

import (
	"context"
	"fmt"
	"log"
	"time"
	"garbage_trucks/backend/internal/database"
)

type Route struct {
	ID          int              `json:"id"`
	DriverID    int              `json:"driver_id"`
	PointID     int              `json:"point_id"`
	OrderNumber int              `json:"order_number"`
	ScheduledAt time.Time        `json:"scheduled_at"`
	Status      string           `json:"status"`
	CompletedAt *time.Time       `json:"completed_at,omitempty"`
	Comment     *string          `json:"comment,omitempty"`
	Point       *CollectionPoint `json:"point"`
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
    // Проверяем допустимые статусы
    validStatuses := map[string]bool{
        "pending":   true,
        "completed": true,
        "problem":   true,
    }
    
    if !validStatuses[status] {
        return fmt.Errorf("недопустимый статус: %s", status)
    }

    // Простой запрос - триггер сам обновит updated_at
    query := `UPDATE routes SET status = $1 WHERE id = $2`

    log.Printf("Updating route %d to status %s", routeID, status)

    result, err := database.Pool.Exec(ctx, query, status, routeID)
    if err != nil {
        log.Printf("Database error: %v", err)
        return err
    }

    if result.RowsAffected() == 0 {
        return fmt.Errorf("маршрут с ID %d не найден", routeID)
    }

    return nil
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