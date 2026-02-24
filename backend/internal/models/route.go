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

// AddRoutePoint - добавить точку в маршрут водителя
func AddRoutePoint(ctx context.Context, driverID, pointID int) error {
    // Проверяем, существует ли уже такая точка у водителя
    var exists bool
    checkQuery := `SELECT EXISTS(SELECT 1 FROM routes WHERE driver_id = $1 AND point_id = $2)`
    err := database.Pool.QueryRow(ctx, checkQuery, driverID, pointID).Scan(&exists)
    if err != nil {
        log.Printf("Error checking existing route: %v", err)
        return err
    }

    if exists {
        return fmt.Errorf("точка уже добавлена в маршрут водителя")
    }

    // Получаем следующий order_number для водителя
    var maxOrder int
    orderQuery := `SELECT COALESCE(MAX(order_number), 0) FROM routes WHERE driver_id = $1`
    err = database.Pool.QueryRow(ctx, orderQuery, driverID).Scan(&maxOrder)
    if err != nil {
        log.Printf("Error getting max order: %v", err)
        return err
    }

    newOrder := maxOrder + 1

    // 👇 ИСПРАВЛЕННЫЙ ЗАПРОС - используем отдельные параметры
    insertQuery := `
        INSERT INTO routes (driver_id, point_id, order_number, scheduled_at, status)
        VALUES ($1, $2, $3, CURRENT_DATE + TIME '08:00:00' + (INTERVAL '10 minutes' * $4), 'pending')
    `
    
    log.Printf("Adding route: driver=%d, point=%d, order=%d", driverID, pointID, newOrder)
    
    // 👇 Передаем newOrder дважды: как число и как множитель для интервала
    _, err = database.Pool.Exec(ctx, insertQuery, driverID, pointID, newOrder, newOrder)
    if err != nil {
        log.Printf("Error inserting route: %v", err)
        return err
    }

    return nil
}

// RemoveRoutePoint - удалить точку из маршрута водителя
func RemoveRoutePoint(ctx context.Context, driverID, pointID int) error {
    // Удаляем точку из маршрута
    deleteQuery := `DELETE FROM routes WHERE driver_id = $1 AND point_id = $2`
    
    result, err := database.Pool.Exec(ctx, deleteQuery, driverID, pointID)
    if err != nil {
        log.Printf("Error deleting route: %v", err)
        return err
    }

    if result.RowsAffected() == 0 {
        return fmt.Errorf("точка не найдена в маршруте водителя")
    }

    // Перенумеровываем order_number для оставшихся точек
    reorderQuery := `
        WITH numbered AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
            FROM routes
            WHERE driver_id = $1
        )
        UPDATE routes r
        SET order_number = n.new_order
        FROM numbered n
        WHERE r.id = n.id
    `
    
    _, err = database.Pool.Exec(ctx, reorderQuery, driverID)
    if err != nil {
        log.Printf("Error reordering routes: %v", err)
        // Не возвращаем ошибку, так как точка уже удалена
    }

    return nil
}