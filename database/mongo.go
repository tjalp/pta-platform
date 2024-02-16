package database

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
	"time"
)

type MongoDatabase struct{}

var client *mongo.Client
var mongodb *mongo.Database

func (s MongoDatabase) Start() error {
	fmt.Println("Opening MongoDB connection...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb+srv://tjalpnet:vQAiZJatK3BdS494@cluster0.9h5k0p3.mongodb.net/?retryWrites=true&w=majority")) // i know... :)
	if err != nil {
		return err
	}
	ctx, cancel = context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		return err
	}
	fmt.Println("Successfully opened MongoDB connection")
	mongodb = client.Database("pta-platform")
	s.SavePta(ptaData[0])
	return nil
}

func (s MongoDatabase) Terminate() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := client.Disconnect(ctx); err != nil {
		panic(err)
	}
}

func (s MongoDatabase) SavePta(data PtaData) {
	collection := mongodb.Collection("ptas")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.ReplaceOne(ctx, bson.D{{"id", data.Id}}, data, options.Replace().SetUpsert(true))
	if err != nil {
		panic(err)
	}
}

func (s MongoDatabase) LoadPta(id string) *PtaData {
	collection := mongodb.Collection("ptas")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var result PtaData
	err := collection.FindOne(ctx, bson.D{{"id", id}}).Decode(&result)
	if err != nil {
		panic(err)
		return nil
	}
	return &result
}

func (s MongoDatabase) DeletePta(id string) bool {
	collection := mongodb.Collection("ptas")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.DeleteOne(ctx, bson.D{{"id", id}})
	if err != nil {
		panic(err)
		return false
	}
	return true
}

func (s MongoDatabase) SearchPta(params map[string][]string) []PtaData {
	collection := mongodb.Collection("ptas")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.D{}
	for k, v := range params {
		filter = append(filter, bson.E{Key: k, Value: v[0]})
	}

	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result []PtaData
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	return result
}

func (s MongoDatabase) GetTools() []string {
	collection := mongodb.Collection("tools")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result []struct{ Name string }
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	var tools []string
	for _, tool := range result {
		tools = append(tools, tool.Name)
	}
	return tools
}

func (s MongoDatabase) SetTools(tools []string) {
	collection := mongodb.Collection("tools")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.DeleteMany(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	var documents []interface{}
	for _, tool := range tools {
		documents = append(documents, bson.D{{"name", tool}})
	}
	_, err = collection.InsertMany(ctx, documents)
	if err != nil {
		panic(err)
	}
}

func (s MongoDatabase) GetSubjects() []Subject {
	collection := mongodb.Collection("subjects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	defer cursor.Close(ctx)
	var result []Subject
	err = cursor.All(ctx, &result)
	if err != nil {
		panic(err)
	}
	return result
}

func (s MongoDatabase) SetSubjects(subjects []Subject) {
	collection := mongodb.Collection("subjects")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := collection.DeleteMany(ctx, bson.D{})
	if err != nil {
		panic(err)
	}
	var documents []interface{}
	for _, subject := range subjects {
		documents = append(documents, subject)
	}
	_, err = collection.InsertMany(ctx, documents)
	if err != nil {
		panic(err)
	}
}
