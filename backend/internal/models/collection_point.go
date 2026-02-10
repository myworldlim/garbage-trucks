package models

import (
	"context"
	"log"
	"garbage_trucks/backend/internal/database"
)

type CollectionPoint struct {
	ID        int      `json:"id"`
	Name      string   `json:"name"`
	Address   string   `json:"address"`
	Latitude  float64  `json:"latitude"`
	Longitude float64  `json:"longitude"`
	City      string   `json:"city"`
	Drivers   []string `json:"drivers,omitempty"`
}

func GetAllPoints(ctx context.Context) ([]CollectionPoint, error) {
	rows, err := database.Pool.Query(ctx, `
		SELECT 
			cp.id, cp.name, cp.address, cp.latitude, cp.longitude, cp.city,
			COALESCE(ARRAY_AGG(DISTINCT d.name) FILTER (WHERE d.name IS NOT NULL), '{}') as drivers
		FROM collection_points cp
		LEFT JOIN routes r ON cp.id = r.point_id
		LEFT JOIN drivers d ON r.driver_id = d.id
		GROUP BY cp.id, cp.name, cp.address, cp.latitude, cp.longitude, cp.city
		ORDER BY cp.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []CollectionPoint
	for rows.Next() {
		var p CollectionPoint
		if err := rows.Scan(&p.ID, &p.Name, &p.Address, &p.Latitude, &p.Longitude, &p.City, &p.Drivers); err != nil {
			return nil, err
		}
		points = append(points, p)
	}

	return points, rows.Err()
}

func CreatePoint(ctx context.Context, name, address, city string, latitude, longitude float64) (*CollectionPoint, error) {
	var point CollectionPoint
	err := database.Pool.QueryRow(ctx, `
		INSERT INTO collection_points (name, address, latitude, longitude, city) 
		VALUES ($1, $2, $3, $4, $5) 
		RETURNING id, name, address, latitude, longitude, city
	`, name, address, latitude, longitude, city).Scan(&point.ID, &point.Name, &point.Address, &point.Latitude, &point.Longitude, &point.City)
	
	if err != nil {
		return nil, err
	}
	
	return &point, nil
}

func CreatePointWithDrivers(ctx context.Context, name, address, city string, latitude, longitude float64, driverIDs []int) (*CollectionPoint, error) {
	// Создаем точку
	point, err := CreatePoint(ctx, name, address, city, latitude, longitude)
	if err != nil {
		return nil, err
	}

	log.Printf("Created point %d, adding drivers: %v", point.ID, driverIDs)

	// Создаем маршруты для каждого водителя
	for _, driverID := range driverIDs {
		// Получаем следующий order_number для водителя
		var maxOrder int
		err := database.Pool.QueryRow(ctx, `
			SELECT COALESCE(MAX(order_number), 0) FROM routes WHERE driver_id = $1
		`, driverID).Scan(&maxOrder)
		if err != nil {
			log.Printf("Error getting max order for driver %d: %v", driverID, err)
			continue
		}

		// Создаем маршрут
		_, err = database.Pool.Exec(ctx, `
			INSERT INTO routes (driver_id, point_id, order_number, scheduled_at, status)
			VALUES ($1, $2, $3, CURRENT_DATE + TIME '08:00:00' + (INTERVAL '10 minutes' * ($3 - 1)), 'pending')
		`, driverID, point.ID, maxOrder+1)
		if err != nil {
			log.Printf("Error creating route for driver %d, point %d: %v", driverID, point.ID, err)
			continue
		}
		log.Printf("Created route: driver=%d, point=%d, order=%d", driverID, point.ID, maxOrder+1)
	}

	return point, nil
}

func DeletePoint(ctx context.Context, id int) error {
	_, err := database.Pool.Exec(ctx, `DELETE FROM collection_points WHERE id = $1`, id)
	return err
}

func UpdatePoint(ctx context.Context, id int, name, address, city string, latitude, longitude float64) (*CollectionPoint, error) {
	var point CollectionPoint
	err := database.Pool.QueryRow(ctx, `
		UPDATE collection_points 
		SET name = $1, address = $2, latitude = $3, longitude = $4, city = $5
		WHERE id = $6
		RETURNING id, name, address, latitude, longitude, city
	`, name, address, latitude, longitude, city, id).Scan(&point.ID, &point.Name, &point.Address, &point.Latitude, &point.Longitude, &point.City)
	
	if err != nil {
		return nil, err
	}
	
	return &point, nil
}

func UpdatePointWithDrivers(ctx context.Context, id int, name, address, city string, latitude, longitude float64, driverIDs []int) (*CollectionPoint, error) {
	// Обновляем точку
	point, err := UpdatePoint(ctx, id, name, address, city, latitude, longitude)
	if err != nil {
		return nil, err
	}

	log.Printf("Updated point %d, updating drivers: %v", id, driverIDs)

	// Удаляем старые маршруты
	_, err = database.Pool.Exec(ctx, `DELETE FROM routes WHERE point_id = $1`, id)
	if err != nil {
		log.Printf("Error deleting old routes for point %d: %v", id, err)
		return nil, err
	}

	// Создаем новые маршруты
	for _, driverID := range driverIDs {
		var maxOrder int
		err := database.Pool.QueryRow(ctx, `
			SELECT COALESCE(MAX(order_number), 0) FROM routes WHERE driver_id = $1
		`, driverID).Scan(&maxOrder)
		if err != nil {
			log.Printf("Error getting max order for driver %d: %v", driverID, err)
			continue
		}

		_, err = database.Pool.Exec(ctx, `
			INSERT INTO routes (driver_id, point_id, order_number, scheduled_at, status)
			VALUES ($1, $2, $3, CURRENT_DATE + TIME '08:00:00' + (INTERVAL '10 minutes' * ($3 - 1)), 'pending')
		`, driverID, point.ID, maxOrder+1)
		if err != nil {
			log.Printf("Error creating route for driver %d, point %d: %v", driverID, point.ID, err)
			continue
		}
		log.Printf("Created route: driver=%d, point=%d, order=%d", driverID, point.ID, maxOrder+1)
	}

	return point, nil
}