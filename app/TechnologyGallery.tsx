"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TECHNOLOGY_CATEGORIES, type TechnologyCategory } from "./technologyCatalog";

const ICONS: Record<string, string> = {
  "Karpenter":"karpenter", "Teleport":"teleport",
  "Kubernetes":"kubernetes", "Docker":"docker", "Helm":"helm", "Argo CD":"argocd",
  "Terraform":"terraform", "Terraform Cloud":"terraform", "Custom Terraform providers":"terraform",
  "Ansible":"ansible", "Python infrastructure automation":"python", "Python testing automation":"python",
  "Django":"django", "Django REST Framework":"django", "FastAPI":"fastapi", "Streamlit":"streamlit",
  "Celery":"celery", "Vue.js":"vuejs", "OpenID-based authorization":"openid",
  "MySQL":"mysql", "PostgreSQL":"postgresql", "Redis":"redis", "DynamoDB":"aws-dynamodb",
  "Amazon Aurora":"aws-aurora", "Amazon RDS":"aws-rds", "ElastiCache":"aws-elasticache",
  "Git":"git", "GitLab & GitLab pipelines":"gitlab", "GitHub":"github", "Bitbucket":"bitbucket", "Jenkins":"jenkins",
  "Datadog":"datadog", "New Relic":"new-relic-icon", "Amazon CloudWatch":"aws-cloudwatch",
  "Locust":"locust", "JMeter":"apachejmeter", "Postman":"postman",
  "AWS Aurora Terraform-module validation with FastAPI and Streamlit":"terraform",
  "Visual Studio Code":"vscode", "pgAdmin":"pgadmin", "Jira":"jira", "Confluence":"confluence",
  "Microsoft Teams":"microsoft-teams", "Service Desk operations":"jira",
  "Python":"python", "Go":"go", "HTML":"html5", "Linux":"linux-tux", "Windows":"microsoft-windows-icon", "macOS":"apple",
  "ChatGPT":"openai", "Codex":"codex", "Claude":"claude-icon", "GitHub Copilot":"github-copilot", "MCP":"modelcontextprotocol",
  "EC2":"aws-ec2", "Lambda":"aws-lambda", "EKS":"aws-eks", "ECS":"aws-ecs", "Fargate":"aws-fargate",
  "S3":"aws-s3", "RDS":"aws-rds", "Aurora":"aws-aurora", "VPC":"aws-vpc", "CloudFront":"aws-cloudfront",
  "API Gateway":"aws-api-gateway", "IAM":"aws-iam", "Cognito":"aws-cognito", "WAF":"aws-waf",
  "Secrets Manager":"aws-secrets-manager", "KMS":"aws-kms", "SNS":"aws-sns", "SQS":"aws-sqs", "SES":"aws-ses",
  "EventBridge":"aws-eventbridge", "CloudWatch":"aws-cloudwatch",
  "CodePipeline":"aws-codepipeline", "CodeBuild":"aws-codebuild", "CodeDeploy":"aws-codedeploy",
  "AWS CodePipeline":"aws-codepipeline", "AWS CodeBuild":"aws-codebuild", "AWS CodeDeploy":"aws-codedeploy",
  "AWS Transfer Family":"amazonwebservices", "Amazon Transcribe":"amazonwebservices", "Amazon Translate":"amazonwebservices",
};

function entries(category?: TechnologyCategory) {
  return (category ? [category] : TECHNOLOGY_CATEGORIES).flatMap(group => {
    const names = group.id === "cloud" ? group.items.flatMap(line => (line.includes(": ")?line.split(": ").slice(1).join(": ").split(", "):[line])) : group.items;
    return names.map(name => ({ name, category: group.short, icon: ICONS[name] }));
  });
}

export default function TechnologyGallery({ category, visible }: { category?: TechnologyCategory; visible: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  // Do not fetch/decode the entire hidden gallery as the camera passes this station.
  // Keep it mounted after opening so the reverse closing animation stays intact.
  const [opened, setOpened] = useState(visible);
  useEffect(() => { if (visible) setOpened(true); }, [visible]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const items = entries(category);
  useEffect(() => {
    if (!visible || !root.current) return;
    setRevealed(new Set());
    const observer = new IntersectionObserver(records => {
      const indices = records.filter(record => record.isIntersecting).map(record => Number((record.target as HTMLElement).dataset.techItem));
      if (indices.length) setRevealed(previous => new Set([...previous, ...indices]));
      records.filter(record => record.isIntersecting).forEach(record => observer.unobserve(record.target));
    }, { threshold: .12 });
    root.current.querySelectorAll("[data-tech-item]").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [category?.id, visible, opened]);
  if (!opened) return null;
  return <div ref={root} className="technologyGallery">
    <div className="galleryCaption"><span>{items.length} ITEMS</span></div>
    <div className="technologyItemGrid">
      {items.map((item, index) => <article key={`${index}-${item.name}`} data-tech-item={index}
        className={`technologyItem ${revealed.has(index) ? "isRevealed" : ""}`}
        style={{ "--reveal-delay": `${450 + (index % 6) * 100}ms` } as CSSProperties}>
        <span className="technologyItemNumber">{String(index + 1).padStart(2, "0")}</span>
        <div className="technologyItemLogo">
          {item.icon ? <img src={`/technology-logos/${item.icon}.svg`} alt="" width={92} height={92} /> : <span className="technologyWorkflowIcon" aria-hidden="true">{item.name === "Karpenter" ? "K" : item.name === "Teleport" ? "T" : "⌘"}</span>}
        </div>
        <h4>{item.name}</h4>
        {!category && <small>{item.category}</small>}
        {!item.icon && <small>{["Karpenter", "Teleport"].includes(item.name) ? "TOOL" : "WORKFLOW / CONCEPT"}</small>}
        <span className="technologyItemAccent" aria-hidden="true" />
      </article>)}
    </div>
  </div>;
}
